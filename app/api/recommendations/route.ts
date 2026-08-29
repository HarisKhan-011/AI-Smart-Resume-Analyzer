import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Recommendations API - GET' });
}

export async function POST() {
  return NextResponse.json({ message: 'Recommendations API - POST' });
}
