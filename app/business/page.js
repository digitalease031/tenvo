import { redirect } from 'next/navigation';

/**
 * Root /business route — redirect to multi-business overview or user workspace.
 */
export default function BusinessRootPage() {
  redirect('/multi-business');
}
