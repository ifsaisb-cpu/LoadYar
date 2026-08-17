import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

class ToastService {
  show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    Toast.show({
      type,
      position: 'top',
      text1: message,
      duration,
      topOffset: 50,
    });
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration || 4000);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  // Common API error handler
  handleApiError(error: any): void {
    if (error.response?.data?.message) {
      this.error(error.response.data.message);
    } else if (error.response?.status === 401) {
      this.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      this.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      this.error('Resource not found.');
    } else if (error.response?.status === 429) {
      this.error('Too many requests. Please wait a moment.');
    } else if (error.message === 'Network Error') {
      this.warning('No internet connection. Changes will sync when online.');
    } else {
      this.error(error.message || 'An error occurred. Please try again.');
    }
  }

  // Validation error handler
  handleValidationError(errors: string[]): void {
    if (errors.length === 1) {
      this.error(errors[0]);
    } else {
      const message = errors.join('\n');
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Validation Error',
        text2: message,
        duration: 5000,
        topOffset: 50,
      });
    }
  }

  hide(): void {
    Toast.hide();
  }
}

export const toastService = new ToastService();
