import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Resume API - GET' });
}

export async function POST() {
  return NextResponse.json({ message: 'Resume API - POST' });
}
