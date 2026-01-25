import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/,/g, '.') + ' so\'m';
}

// Pul miqdorini formatlash uchun yordamchi funksiya
export function formatNumber(value: string): string {
  // Faqat raqamlarni qoldirish
  const numbers = value.replace(/\D/g, '');
  
  // Agar bo'sh bo'lsa, bo'sh string qaytarish
  if (!numbers) return '';
  
  // Raqamlarni 3 ta guruhga bo'lib nuqta bilan ajratish
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Formatlanган stringni raqamga aylantirish
export function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/\./g, '')) || 0;
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'badge-danger';
    case 'high':
      return 'badge-warning';
    case 'medium':
      return 'badge-primary';
    case 'low':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'paid':
    case 'delivered':
      return 'badge-success';
    case 'in-progress':
    case 'partial':
      return 'badge-warning';
    case 'assigned':
    case 'pending':
      return 'badge-primary';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-gray';
  }
}