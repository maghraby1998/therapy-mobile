import { gql } from "@apollo/client";

export const START_VIDEO_CALL_MUTATION = gql`
  mutation StartVideoCall($sessionId: ID!) {
    startVideoCall(sessionId: $sessionId) {
      roomName
      token
      sessionId
    }
  }
`;

export const JOIN_VIDEO_CALL_MUTATION = gql`
  mutation JoinVideoCall($sessionId: ID!) {
    joinVideoCall(sessionId: $sessionId) {
      roomName
      token
      sessionId
    }
  }
`;

export type VideoCallRoom = {
  roomName: string;
  token: string;
  sessionId: string;
};

export type StartVideoCallData = {
  startVideoCall: VideoCallRoom;
};

export type JoinVideoCallData = {
  joinVideoCall: VideoCallRoom;
};

export type VideoCallVariables = {
  sessionId: string;
};
