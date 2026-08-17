import * as Permissions from 'expo-permissions';
import { BarcodeType, BarCodeScannerResult } from 'expo-barcode-scanner';

export interface ScannedData {
  type: string;
  data: string;
  timestamp: number;
  format: string;
}

export interface QRCodeData {
  tripId?: number;
  invoiceId?: number;
  vehicleId?: number;
  biltyNo?: string;
  customData?: any;
}

class BarcodeService {
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Permissions.getAsync(Permissions.CAMERA);
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Check camera permission error:', error);
      return false;
    }
  }

  parseBarcode(data: string, type: string): ScannedData {
    return {
      type,
      data,
      timestamp: Date.now(),
      format: this.getBarcodeFormat(type),
    };
  }

  private getBarcodeFormat(type: BarcodeType): string {
    const formats: { [key: number]: string } = {
      [BarcodeType.qr]: 'QR Code',
      [BarcodeType.code128]: 'Code 128',
      [BarcodeType.code39]: 'Code 39',
      [BarcodeType.ean13]: 'EAN-13',
      [BarcodeType.ean8]: 'EAN-8',
      [BarcodeType.upce]: 'UPC-E',
      [BarcodeType.pdf417]: 'PDF417',
      [BarcodeType.datamatrix]: 'Data Matrix',
      [BarcodeType.interleaved2of5]: 'Interleaved 2 of 5',
      [BarcodeType.aztec]: 'Aztec',
      [BarcodeType.codabar]: 'Codabar',
    };
    return formats[type] || 'Unknown';
  }

  parseQRCode(data: string): QRCodeData {
    try {
      // Try to parse as JSON (custom QR data)
      return JSON.parse(data);
    } catch (error) {
      // Try to parse as URL parameters
      try {
        const url = new URL(data);
        return {
          biltyNo: url.searchParams.get('bilty') || undefined,
          tripId: url.searchParams.get('trip')
            ? parseInt(url.searchParams.get('trip') || '0', 10)
            : undefined,
          invoiceId: url.searchParams.get('invoice')
            ? parseInt(url.searchParams.get('invoice') || '0', 10)
            : undefined,
          customData: Object.fromEntries(url.searchParams),
        };
      } catch (urlError) {
        // Return raw data
        return { customData: { raw: data } };
      }
    }
  }

  generateQRData(tripId: number, biltyNo: string): string {
    const data: QRCodeData = {
      tripId,
      biltyNo,
    };
    return JSON.stringify(data);
  }

  generateQRUrl(
    tripId: number,
    biltyNo: string,
    baseUrl: string = 'https://app.loadyar.pk',
  ): string {
    const params = new URLSearchParams({
      trip: tripId.toString(),
      bilty: biltyNo,
    });
    return `${baseUrl}/trip?${params.toString()}`;
  }

  validateQRCode(data: QRCodeData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.tripId && !data.invoiceId && !data.vehicleId && !data.biltyNo) {
      errors.push('QR code must contain at least one identifier');
    }

    if (data.tripId && (data.tripId < 1 || !Number.isInteger(data.tripId))) {
      errors.push('Invalid trip ID');
    }

    if (data.invoiceId && (data.invoiceId < 1 || !Number.isInteger(data.invoiceId))) {
      errors.push('Invalid invoice ID');
    }

    if (data.vehicleId && (data.vehicleId < 1 || !Number.isInteger(data.vehicleId))) {
      errors.push('Invalid vehicle ID');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async scanBiltyNo(scannedData: string): Promise<{ valid: boolean; biltyNo: string | null }> {
    try {
      // Try multiple parsing approaches
      const trimmed = scannedData.trim();

      // If it looks like a bilty number (alphanumeric)
      if (/^[A-Z0-9\-]+$/.test(trimmed)) {
        return { valid: true, biltyNo: trimmed };
      }

      // Try to extract from QR code data
      const qrData = this.parseQRCode(trimmed);
      if (qrData.biltyNo) {
        return { valid: true, biltyNo: qrData.biltyNo };
      }

      // Try to extract from URL
      try {
        const url = new URL(trimmed);
        const bilty = url.searchParams.get('bilty');
        if (bilty) {
          return { valid: true, biltyNo: bilty };
        }
      } catch (urlError) {
        // Not a URL
      }

      return { valid: false, biltyNo: null };
    } catch (error) {
      console.error('Scan bilty number error:', error);
      return { valid: false, biltyNo: null };
    }
  }

  // Batch processing for multiple scans
  async processBatchScans(
    scans: BarCodeScannerResult[],
  ): Promise<{ valid: ScannedData[]; invalid: string[] }> {
    const valid: ScannedData[] = [];
    const invalid: string[] = [];

    for (const scan of scans) {
      try {
        const parsed = this.parseBarcode(scan.data, scan.type);
        valid.push(parsed);
      } catch (error) {
        invalid.push(scan.data);
      }
    }

    return { valid, invalid };
  }
}

export const barcodeService = new BarcodeService();
