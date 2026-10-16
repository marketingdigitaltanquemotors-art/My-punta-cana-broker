import type { Metadata } from 'next';
import { getDatabase } from '@/db';

const siteUrl = 'https://broker.havelgo.com';
const fallbackDescription =
  'Conoce este proyecto de solares en Punta Cana-Bávaro y agenda una visita con My Punta Cana Broker.';
const fallbackTitle = 'Solares en Punta Cana-Bávaro | My Punta Cana Broker';

type ProjectLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ profileId: string }>;
}>;

type ProfileSettingRow = {
  name: string;
  key: string | null;
  value: string | null;
};
type ProjectImageRow = { media_key: string | null; image_url: string | null };

function publicImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl, siteUrl);
    return url.protocol === 'https:' && url.origin === siteUrl ? url : null;
  } catch {
    return null;
  }
}

async function getProjectMetadata(profileId: number) {
  const rows = await getDatabase()
    .prepare(`SELECT p.name, s.key, s.value
      FROM project_profiles p
      LEFT JOIN project_profile_settings s
        ON s.profile_id = p.id AND s.key IN ('project_name', 'text_heroTitle', 'text_heroSubtitle')
      WHERE p.id = ?`)
    .bind(profileId)
    .all<ProfileSettingRow>();

  if (!rows.results?.length) return null;

  const profileName = rows.results[0].name;
  const settings = new Map(
    rows.results
      .filter(
        (row): row is ProfileSettingRow & { key: string; value: string } =>
          Boolean(row.key && row.value),
      )
      .map(({ key, value }) => [key, value]),
  );
  const projectName =
    settings.get('project_name')?.trim() || profileName?.trim() || '';
  const isDefaultName = !projectName || /^perfil principal$/i.test(projectName);

  const projectImage = await getDatabase()
    .prepare(`SELECT COALESCE(m.key, c.media_key, c.image_key) AS media_key, c.image_url
      FROM content_items c
      LEFT JOIN media_items m ON m.key = COALESCE(c.media_key, c.image_key)
      WHERE c.profile_id = ? AND c.type = 'solar'
      ORDER BY c.created_at DESC
      LIMIT 1`)
    .bind(profileId)
    .first<ProjectImageRow>();

  const solarImageUrl = publicImageUrl(projectImage?.image_url ?? null);
  const builtImage = projectImage?.media_key
    ? projectImage.media_key
    : solarImageUrl
      ? ''
      : await getDatabase()
          .prepare(
            "SELECT key FROM media_items WHERE profile_id = ? AND kind = 'built-home' ORDER BY sort_order ASC, key ASC LIMIT 1",
          )
          .bind(profileId)
          .first<{ key: string }>()
          .then((row) => row?.key ?? '');

  const imageUrl = solarImageUrl ?? new URL('/og.png', siteUrl);
  if (projectImage?.media_key) {
    imageUrl.pathname = '/api/content/image';
    imageUrl.searchParams.set('key', projectImage.media_key);
  } else if (builtImage) {
    imageUrl.pathname = '/api/content/image';
    imageUrl.searchParams.set('key', builtImage);
  }

  const heroTitle = settings.get('text_heroTitle')?.trim();
  const heroSubtitle = settings.get('text_heroSubtitle')?.trim();
  const title = isDefaultName
    ? fallbackTitle
    : `${projectName} | My Punta Cana Broker`;
  const projectDescription = heroSubtitle || heroTitle || fallbackDescription;
  const description = (
    isDefaultName ? projectDescription : `${projectName}: ${projectDescription}`
  ).slice(0, 300);
  const path = `/proyecto/${profileId}`;

  return {
    title,
    description,
    canonical: new URL(path, siteUrl).toString(),
    image: imageUrl.toString(),
    imageAlt: isDefaultName
      ? 'Solares en Punta Cana-Bávaro'
      : `Proyecto ${projectName} en Punta Cana-Bávaro`,
  };
}

export async function generateMetadata({
  params,
}: ProjectLayoutProps): Promise<Metadata> {
  const { profileId: rawProfileId } = await params;
  const profileId = Number(rawProfileId);
  let project: Awaited<ReturnType<typeof getProjectMetadata>> = null;

  if (Number.isInteger(profileId) && profileId > 0) {
    try {
      project = await getProjectMetadata(profileId);
    } catch (error) {
      console.error('project_metadata_error', error);
    }
  }

  const fallbackPath =
    Number.isInteger(profileId) && profileId > 0
      ? `/proyecto/${profileId}`
      : '/proyecto';
  const metadata = project ?? {
    title: fallbackTitle,
    description: fallbackDescription,
    canonical: new URL(fallbackPath, siteUrl).toString(),
    image: new URL('/og.png', siteUrl).toString(),
    imageAlt: 'My Punta Cana Broker',
  };

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: { canonical: metadata.canonical },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: metadata.canonical,
      siteName: 'My Punta Cana Broker',
      locale: 'es_DO',
      type: 'website',
      images: [{ url: metadata.image, alt: metadata.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [{ url: metadata.image, alt: metadata.imageAlt }],
    },
  };
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  return children;
}
