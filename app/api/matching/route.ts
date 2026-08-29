import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Matching API - GET' });
}

export async function POST() {
  return NextResponse.json({ message: 'Matching API - POST' });
}
