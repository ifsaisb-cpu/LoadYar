import { storageService } from './storage';
import * as FileSystem from 'expo-file-system';

export interface MapTile {
  z: number; // Zoom level
  x: number; // Tile X coordinate
  y: number; // Tile Y coordinate
  url: string;
  cached: boolean;
  cachedAt?: string;
}

export interface CachedRegion {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevels: number[];
  tiles: MapTile[];
  downloadedAt: string;
  sizeBytes: number;
}

class MapService {
  private tileServerUrl = 'https://tile.openstreetmap.org';
  private cacheDir = FileSystem.cacheDirectory + 'maps/';
  private cachedRegions: CachedRegion[] = [];

  async init(): Promise<void> {
    try {
      await FileSystem.makeDirectoryAsync(this.cacheDir, {
        intermediates: true,
      });
      await this.loadCachedRegions();
    } catch (error) {
      console.error('Map service init error:', error);
    }
  }

  /**
   * Calculate tile coordinates from latitude/longitude
   */
  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
    );
    return { x, y };
  }

  /**
   * Get all tiles needed for a region at given zoom levels
   */
  private getTilesForRegion(
    bounds: { north: number; south: number; east: number; west: number },
    zoomLevels: number[]
  ): MapTile[] {
    const tiles: MapTile[] = [];

    zoomLevels.forEach((zoom) => {
      const nw = this.latLngToTile(bounds.north, bounds.west, zoom);
      const se = this.latLngToTile(bounds.south, bounds.east, zoom);

      for (let x = nw.x; x <= se.x; x++) {
        for (let y = nw.y; y <= se.y; y++) {
          const url = `${this.tileServerUrl}/${zoom}/${x}/${y}.png`;
          tiles.push({
            z: zoom,
            x,
            y,
            url,
            cached: false,
          });
        }
      }
    });

    return tiles;
  }

  /**
   * Download and cache a region for offline use
   */
  async downloadRegion(
    id: string,
    name: string,
    bounds: { north: number; south: number; east: number; west: number },
    zoomLevels: number[] = [10, 11, 12, 13, 14]
  ): Promise<CachedRegion> {
    try {
      const tiles = this.getTilesForRegion(bounds, zoomLevels);
      let downloadedCount = 0;
      let totalSize = 0;

      for (const tile of tiles) {
        try {
          const fileName = `${this.cacheDir}${tile.z}-${tile.x}-${tile.y}.png`;

          // Check if already cached
          const info = await FileSystem.getInfoAsync(fileName);
          if (info.exists && info.isDirectory === false) {
            tile.cached = true;
            tile.cachedAt = new Date().toISOString();
            totalSize += info.size || 0;
            downloadedCount++;
            continue;
          }

          // Download tile
          const response = await FileSystem.downloadAsync(tile.url, fileName);
          if (response.status === 200) {
            tile.cached = true;
            tile.cachedAt = new Date().toISOString();
            const fileInfo = await FileSystem.getInfoAsync(fileName);
            totalSize += fileInfo.size || 0;
            downloadedCount++;
          }
        } catch (error) {
          console.error(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}:`, error);
        }
      }

      const region: CachedRegion = {
        id,
        name,
        bounds,
        zoomLevels,
        tiles: tiles.filter((t) => t.cached),
        downloadedAt: new Date().toISOString(),
        sizeBytes: totalSize,
      };

      this.cachedRegions.push(region);
      await this.saveCachedRegions();

      console.log(
        `Downloaded ${downloadedCount}/${tiles.length} tiles for region ${name} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`
      );

      return region;
    } catch (error) {
      console.error('Download region error:', error);
      throw error;
    }
  }

  /**
   * Get cached tile if available
   */
  async getTile(z: number, x: number, y: number): Promise<string | null> {
    try {
      const fileName = `${this.cacheDir}${z}-${x}-${y}.png`;
      const info = await FileSystem.getInfoAsync(fileName);

      if (info.exists && info.isDirectory === false) {
        return `file://${fileName}`;
      }

      return null;
    } catch (error) {
      console.error('Get tile error:', error);
      return null;
    }
  }

  /**
   * Get all cached regions
   */
  async getCachedRegions(): Promise<CachedRegion[]> {
    return this.cachedRegions;
  }

  /**
   * Delete a cached region
   */
  async deleteRegion(id: string): Promise<void> {
    try {
      const region = this.cachedRegions.find((r) => r.id === id);
      if (!region) return;

      // Delete tile files
      for (const tile of region.tiles) {
        const fileName = `${this.cacheDir}${tile.z}-${tile.x}-${tile.y}.png`;
        try {
          await FileSystem.deleteAsync(fileName, { idempotent: true });
        } catch (error) {
          console.error(`Failed to delete tile ${fileName}:`, error);
        }
      }

      this.cachedRegions = this.cachedRegions.filter((r) => r.id !== id);
      await this.saveCachedRegions();
    } catch (error) {
      console.error('Delete region error:', error);
    }
  }

  /**
   * Get total cache size
   */
  async getCacheSize(): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(this.cacheDir);
      if (info.exists && info.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(this.cacheDir);
        let totalSize = 0;

        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(`${this.cacheDir}${file}`);
          totalSize += fileInfo.size || 0;
        }

        return totalSize;
      }

      return 0;
    } catch (error) {
      console.error('Get cache size error:', error);
      return 0;
    }
  }

  /**
   * Clear all cached maps
   */
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, {
        intermediates: true,
      });
      this.cachedRegions = [];
      await this.saveCachedRegions();
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  /**
   * Save cached regions metadata
   */
  private async saveCachedRegions(): Promise<void> {
    try {
      await storageService.setItem('cached_regions', this.cachedRegions);
    } catch (error) {
      console.error('Save cached regions error:', error);
    }
  }

  /**
   * Load cached regions metadata
   */
  private async loadCachedRegions(): Promise<void> {
    try {
      const regions = await storageService.getItem('cached_regions');
      this.cachedRegions = regions || [];
    } catch (error) {
      console.error('Load cached regions error:', error);
    }
  }

  /**
   * Get tile URL (cached or remote)
   */
  async getTileUrl(z: number, x: number, y: number): Promise<string> {
    const cached = await this.getTile(z, x, y);
    if (cached) {
      return cached;
    }
    return `${this.tileServerUrl}/${z}/${x}/${y}.png`;
  }
}

export const mapService = new MapService();
