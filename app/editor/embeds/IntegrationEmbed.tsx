import { observer } from "mobx-react";
import * as React from "react";
import styled from "styled-components";
import type { EmbedProps } from "@shared/editor/embeds";
import { UnfurlResourceType } from "@shared/types";
import useStores from "~/hooks/useStores";

/**
 * Renders a Linear or GitHub issue / pull request link as an inline card. The
 * data is loaded through Outline's unfurl store (the same source as the hover
 * preview, so auth and caching are handled by the app's ApiClient), and a
 * compact card is drawn from it. Used as the embed component for the Linear and
 * GitHub embed descriptors.
 *
 * @param props the embed props providing the matched href.
 * @returns the rendered card, or the plain link until the data resolves.
 */
function IntegrationEmbed({ attrs }: EmbedProps) {
  const { unfurls } = useStores();
  const url = attrs.href;

  React.useEffect(() => {
    void unfurls.fetchUnfurl({ url });
  }, [unfurls, url]);

  const data = unfurls.get(url)?.data;
  const isIssueOrPr =
    data?.type === UnfurlResourceType.Issue ||
    data?.type === UnfurlResourceType.PR;

  if (!data || !isIssueOrPr) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    );
  }

  return (
    <Card href={data.url ?? url} target="_blank" rel="noopener noreferrer">
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

export default observer(IntegrationEmbed);

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
