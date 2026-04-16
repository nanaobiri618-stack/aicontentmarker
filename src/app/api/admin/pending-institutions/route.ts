import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/pending-institutions - List institutions pending manual review
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin or owner can access
  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get institutions with verificationStatus 'pending' or 'rejected' (failed AI validation)
    const pendingInstitutions = await prisma.institution.findMany({
      where: {
        OR: [
          { verificationStatus: 'pending' },
          { verificationStatus: 'rejected' },
        ],
      },
      include: {
        brandGuides: true,
        socialHandles: true,
        products: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ institutions: pendingInstitutions });
  } catch (error: any) {
    console.error('Error fetching pending institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending institutions' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/pending-institutions - Approve or reject an institution
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin or owner can approve
  const role = (session.user as any).role as string | undefined;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { institutionId, action, adminNote } = await request.json();

    if (!institutionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: institutionId, action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    const note = adminNote || (action === 'approve' 
      ? 'Approved by admin after manual review' 
      : 'Rejected by admin after manual review');

    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: {
        verificationStatus: newStatus,
        verificationNote: note,
      },
    });

    // Update agent task if exists
    await prisma.agentTask.updateMany({
      where: { 
        institutionId: institutionId,
        taskType: 'validation',
      },
      data: { 
        status: action === 'approve' ? 'completed' : 'failed',
      },
    });

    return NextResponse.json({
      success: true,
      institution: updatedInstitution,
      message: `Institution ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error updating institution:', error);
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    );
  }
}
