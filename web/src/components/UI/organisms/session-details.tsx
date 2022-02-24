import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
  APP_HEADER_HEIGHT,
  SUB_APP_HEADER_HEIGHT,
} from "../../../constants/ui";
import { getSelectedSession } from "../../../store/selectors/entities/sessions-selector";
import { getHeaderStyle } from "../../../utils/ui";
import ParallelLayout, { Column } from "../layouts/parallel-layout";
import SerialLayout, { Row } from "../layouts/serial-layout";
import EmptyMessage from "../molecules/empty-message";
import SessionCapabilityDetails from "./session-capability-details";
import SessionLogs from "./session-logs";
import SessionSummary from "./session-summary";
import SessionVideo from "./session-video";
import chroma from "chroma-js";
import Session from "../../../interfaces/session";
import SessionMenuItems from "./session-details-menu-items";
import { Tooltip } from "@mui/material";
import Icon, { Sizes } from "../atoms/icon";

const Container = styled.div`
  @-webkit-keyframes progress {
    0% {
      background-position: 0 0;
    }

    to {
      background-position: 200px 0;
    }
  }

  @keyframes progress {
    0% {
      background-position: 0 0;
    }

    to {
      background-position: 200px 0;
    }
  }

  @keyframes session-summary-expand {
    0% {
      bottom: -5px;
    }
    50% {
      bottom: 0px;
    }
    100% {
      bottom: -5px;
    }
  }

  & > * {
    .collapsible-row {
      transition: height 0.75s ease-out;
    }
  }
`;

const HEADER = styled.div`
  ${(props) => getHeaderStyle(props.theme)};
  padding: 14px 10px;
`;

const Name = styled.div`
  font-size: ${(props) => props.theme.fonts.size.XXL};
`;

const ErrorContainer = styled.div`
  border: 1px solid ${(props) => chroma(props.theme.colors.error).hex()};
  border-left: 5px solid ${(props) => chroma(props.theme.colors.error).hex()};
  background: ${(props) =>
    chroma(props.theme.colors.error).brighten(3.5).hex()};
  border-radius: ${(props) => props.theme.borderRadius.M};
  overflow: scroll;
  padding: 10px;
  margin: 0 15px 0 15px;
  z-index: 1;
`;

const ProgressIndicator = styled.div`
  animation: progress 2s linear infinite;
`;

const RunningProgressIndicator = styled(ProgressIndicator)`
  background: repeating-linear-gradient(
    -45deg,
    #3d85c6,
    #3d85c6 10px,
    #9fc5e8 0,
    #9fc5e8 20px
  );
`;

const PausedProgressIndicator = styled(ProgressIndicator)`
  background: repeating-linear-gradient(
    -45deg,
    #f1c232,
    #f1c232 10px,
    #fff2cc 0,
    #fff2cc 20px
  );
`;
const SummaryContainer = styled.div`
  position: relative;
  display: flex;
  justify-contents: center;
  align-items: center;
  flex-direction: column;
  transition: all 1s;
  height: auto;
`;

const SummaryCollapseIcon = styled.div`
  position: absolute;
  animation: session-summary-expand 1s linear infinite;
  cursor: pointer;

  & > {
    .icon {
      color: #12bbef;
    }
  }
`;

export const SUMMARY_HEIGHT = 110;
export const FAIL_MESSAGE_CONTAINER_HEIGHT = 80;
export const PADDING = 20;
export const VIDEO_PLAYER_HEIGHT = 400;
/* App will go into responsive mode below the given width */
export const RESPONSIVE_WIDTH = 1400;

function hasSessionFailureMessage(session: Session) {
  return session.session_status === "FAILED" && session.session_status_message;
}

function getSessiobDetailsMainContainerHeight(
  session: Session,
  hideSummary: boolean,
) {
  return (
    (hideSummary ? 0 : SUMMARY_HEIGHT) +
    APP_HEADER_HEIGHT +
    SUB_APP_HEADER_HEIGHT +
    PADDING +
    (hasSessionFailureMessage(session) ? FAIL_MESSAGE_CONTAINER_HEIGHT : 0)
  );
}

function getLoadingIndicator(session: Session) {
  if (session.is_paused) {
    return (
      <Tooltip title="Paused" arrow>
        <PausedProgressIndicator />
      </Tooltip>
    );
  } else if (!session.is_completed) {
    return (
      <Tooltip title="Running" arrow>
        <RunningProgressIndicator />
      </Tooltip>
    );
  } else {
    return <></>;
  }
}

export default function SessionDetails() {
  const session = useSelector(getSelectedSession);
  const [hideSummary, setHideSummary] = useState(true);

  const onToggleSummary = useCallback((state) => {
    setHideSummary(state);
  }, []);

  if (!session) {
    return <EmptyMessage>Select a Session</EmptyMessage>;
  }

  const MAIN_CONTENT_CONTAINER_HEIGHT = getSessiobDetailsMainContainerHeight(
    session,
    hideSummary,
  );

  return (
    <Container>
      <SerialLayout>
        <Row height={`${SUB_APP_HEADER_HEIGHT}px`}>
          <HEADER>
            <ParallelLayout>
              <Column grid={10}>
                <Name>{session.name || session.session_id}</Name>
              </Column>
              <Column grid={2}>
                <SessionMenuItems session={session} />
              </Column>
            </ParallelLayout>
          </HEADER>
        </Row>
        <Row
          height={`${hideSummary ? 0 : SUMMARY_HEIGHT}px`}
          className="collapsible-row"
        >
          <SummaryContainer>
            {!hideSummary && <SessionSummary session={session} />}
            <SummaryCollapseIcon className={hideSummary ? "down" : "up"}>
              <Icon
                name={hideSummary ? "chevron-down" : "chevron-up"}
                size={Sizes.XL}
                color="#ff4433"
                tooltip={hideSummary ? "View Summary" : "Hide Summary"}
                onClick={() => onToggleSummary(!hideSummary)}
              />
            </SummaryCollapseIcon>
          </SummaryContainer>
        </Row>
        {/* Animated indicator of the session status */}
        {(!session.is_completed || session.is_paused) && (
          <Row height="4px">{getLoadingIndicator(session)}</Row>
        )}
        {hasSessionFailureMessage(session) && (
          <Row height={`${FAIL_MESSAGE_CONTAINER_HEIGHT}px`} padding={"10px"}>
            <ErrorContainer>{session.session_status_message}</ErrorContainer>
          </Row>
        )}
        <Row height={`calc(100vh - ${MAIN_CONTENT_CONTAINER_HEIGHT}px)`}>
          <ParallelLayout responsiveWidth={RESPONSIVE_WIDTH} responsive>
            <Column grid={4}>
              <SerialLayout
                responsive
                responsiveWidth={RESPONSIVE_WIDTH}
                heightOnResize={`${VIDEO_PLAYER_HEIGHT}px`}
              >
                <Row>
                  <SessionVideo
                    session={session}
                    height={VIDEO_PLAYER_HEIGHT}
                  />
                </Row>
                <Row>
                  <SessionCapabilityDetails
                    responsiveWidth={RESPONSIVE_WIDTH}
                    session={session}
                    height={MAIN_CONTENT_CONTAINER_HEIGHT + VIDEO_PLAYER_HEIGHT}
                  />
                </Row>
              </SerialLayout>
            </Column>
            <Column grid={8}>
              <SessionLogs
                session={session}
                parentHeight={MAIN_CONTENT_CONTAINER_HEIGHT}
              />
            </Column>
          </ParallelLayout>
        </Row>
      </SerialLayout>
    </Container>
  );
}
