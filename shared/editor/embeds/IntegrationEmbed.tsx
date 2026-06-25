import * as React from "react";
import styled from "styled-components";
import { sanitizeUrl } from "../../utils/urls";
import type { EmbedProps } from ".";

interface UnfurlAuthor {
  name: string;
  avatarUrl?: string;
}

interface UnfurlState {
  name: string;
  color?: string;
}

interface UnfurlResponse {
  ok?: boolean;
  type?: string;
  url?: string;
  id?: string;
  title?: string;
  description?: string | null;
  author?: UnfurlAuthor;
  state?: UnfurlState;
}

/**
 * Renders a Linear issue or GitHub issue / pull request link as an inline card
 * by resolving it through Outline's unfurl endpoint (same-origin, cookie
 * authenticated). Used as the `component` for the Linear and GitHub embed
 * descriptors so these links show real context on their own line instead of
 * an "unsupported embed" placeholder.
 *
 * @param props the embed props, providing the matched href.
 * @returns the rendered card.
 */
export default function IntegrationEmbed({ attrs }: EmbedProps) {
  const href = attrs.href;
  const [data, setData] = React.useState<UnfurlResponse | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/urls.unfurl", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: href }),
        });
        if (!res.ok) {
          throw new Error(`Unfurl request failed: ${res.status}`);
        }
        const json = (await res.json()) as UnfurlResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [href]);

  const safeHref = sanitizeUrl(data?.url ?? href) ?? href;

  if (!data && !failed) {
    return <Card as="div">Loading…</Card>;
  }

  if (failed || !data?.title) {
    return (
      <Card href={safeHref} target="_blank" rel="noopener noreferrer">
        <Title>{href}</Title>
      </Card>
    );
  }

  return (
    <Card href={safeHref} target="_blank" rel="noopener noreferrer">
      {(data.state?.name || data.id) && (
        <Header>
          {data.state?.name && (
            <State $color={data.state.color}>{data.state.name}</State>
          )}
          {data.id && <Identifier>{data.id}</Identifier>}
        </Header>
      )}
      <Title>{data.title}</Title>
      {data.description && <Description>{data.description}</Description>}
      {data.author?.name && <Author>{data.author.name}</Author>}
    </Card>
  );
}

const Card = styled.a`
  display: block;
  text-decoration: none;
  border: 1px solid ${(props) => props.theme.embedBorder};
  border-radius: 8px;
  padding: 12px 16px;
  margin: 4px 0;
  color: ${(props) => props.theme.text};
  background: ${(props) => props.theme.background};

  &:hover {
    border-color: ${(props) => props.theme.accent};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const State = styled.span<{ $color?: string }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 10px;
  color: #fff;
  background: ${(props) => props.$color ?? props.theme.textTertiary};
`;

const Identifier = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.textTertiary};
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 15px;
`;

const Description = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Author = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${(props) => props.theme.textTertiary};
`;
