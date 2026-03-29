import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type ChangelogEntry = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  link?: string;
  tags?: string[];
  body?: string;
};

export type ChangelogReactionSummary = {
  like: number;
  dislike: number;
  improvable: number;
};

const CHANGELOG_DIR = path.join(process.cwd(), 'content/changelog');

function toEntryId(fileName: string) {
  return fileName.replace(/\.(md|mdx)$/i, '');
}

export function getChangelogEntryIds() {
  if (!fs.existsSync(CHANGELOG_DIR)) return [];

  return fs
    .readdirSync(CHANGELOG_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map(toEntryId);
}

export function loadChangelog(): ChangelogEntry[] {
  if (!fs.existsSync(CHANGELOG_DIR)) return [];

  return fs
    .readdirSync(CHANGELOG_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const fullPath = path.join(CHANGELOG_DIR, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data, content } = matter(raw);

      return {
        id: toEntryId(file),
        title: (data.title as string) ?? toEntryId(file),
        date: (data.date as string) ?? '1970-01-01',
        summary: data.summary as string | undefined,
        link: data.link as string | undefined,
        tags: (data.tags as string[]) ?? [],
        body: content.trim(),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getChangelogReactionSummary(
  entryIds: string[]
): Promise<Record<string, ChangelogReactionSummary>> {
  const emptySummary = Object.fromEntries(
    entryIds.map((entryId) => [
      entryId,
      {
        like: 0,
        dislike: 0,
        improvable: 0,
      },
    ])
  ) as Record<string, ChangelogReactionSummary>;

  if (entryIds.length === 0) return {};

  let rows: Array<{
    entryId: string;
    reaction: 'LIKE' | 'DISLIKE' | 'IMPROVABLE';
    _count: { _all: number };
  }>;

  try {
    rows = await prisma.changelogReaction.groupBy({
      by: ['entryId', 'reaction'],
      where: {
        entryId: {
          in: entryIds,
        },
      },
      _count: {
        _all: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021'
    ) {
      return emptySummary;
    }

    throw error;
  }

  for (const row of rows) {
    if (row.reaction === 'LIKE') {
      emptySummary[row.entryId].like = row._count._all;
    } else if (row.reaction === 'DISLIKE') {
      emptySummary[row.entryId].dislike = row._count._all;
    } else if (row.reaction === 'IMPROVABLE') {
      emptySummary[row.entryId].improvable = row._count._all;
    }
  }

  return emptySummary;
}
