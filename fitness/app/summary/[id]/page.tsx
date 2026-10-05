'use client';
import { useParams } from 'next/navigation';
import SessionReport from '@/components/SessionReport';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <SessionReport sessionId={id} mode="summary" />;
}
