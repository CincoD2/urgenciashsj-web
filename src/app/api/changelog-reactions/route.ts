import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getChangelogEntryIds, getChangelogReactionSummary } from '@/lib/changelog';
import { prisma } from '@/lib/prisma';

type ReactionKey = 'LIKE' | 'DISLIKE' | 'IMPROVABLE';

function isReactionKey(value: unknown): value is ReactionKey {
  return value === 'LIKE' || value === 'DISLIKE' || value === 'IMPROVABLE';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entryId?: string;
      visitorId?: string;
      reaction?: ReactionKey;
    };

    const entryId = body.entryId?.trim();
    const visitorId = body.visitorId?.trim();
    const reaction = body.reaction;

    if (!entryId || !visitorId || !isReactionKey(reaction)) {
      return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
    }

    if (visitorId.length < 12 || visitorId.length > 120) {
      return NextResponse.json({ ok: false, error: 'Identificador inválido.' }, { status: 400 });
    }

    const validEntries = new Set(getChangelogEntryIds());
    if (!validEntries.has(entryId)) {
      return NextResponse.json({ ok: false, error: 'Novedad no encontrada.' }, { status: 404 });
    }

    const existing = await prisma.changelogReaction.findUnique({
      where: {
        entryId_visitorId: {
          entryId,
          visitorId,
        },
      },
      select: {
        id: true,
        reaction: true,
      },
    });

    let currentReaction: ReactionKey | null = reaction;

    if (existing?.reaction === reaction) {
      await prisma.changelogReaction.delete({
        where: {
          id: existing.id,
        },
      });
      currentReaction = null;
    } else {
      await prisma.changelogReaction.upsert({
        where: {
          entryId_visitorId: {
            entryId,
            visitorId,
          },
        },
        update: {
          reaction,
        },
        create: {
          entryId,
          visitorId,
          reaction,
        },
      });
    }

    const summaryMap = await getChangelogReactionSummary([entryId]);

    return NextResponse.json({
      ok: true,
      currentReaction,
      summary: summaryMap[entryId],
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021'
    ) {
      return NextResponse.json(
        { ok: false, error: 'Las reacciones aún no están activadas en la base de datos.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: false, error: 'Error interno.' }, { status: 500 });
  }
}
