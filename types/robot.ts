export interface Robot {
  name: string;
  robot_peer_id: string;
  status?: 'Online' | 'Unknown';
}

export interface User {
  username: string;
  public_key: string;
}

export interface Message {
  timestamp: string;
  content: any;
  from: string;
  to: string | null;
}

export interface JobMessage {
  type: 'StartJob';
  id: string;
  robot_id: string;
  job_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  args: string; // JSON stringified job arguments
}

export interface Config {
  robots: Robot[];
  users: User[];
  version: number;
}

export interface NetworkPeer {
  peer_id: string;
  peers: string[];
  last_handshake: number;
  is_online: boolean;
  public_key: number[];
}

export interface NetworkInfo {
  [peer_id: string]: NetworkPeer;
}

export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  robot_peer_id: string;
  args?: {
    custom_cmd?: string;
    [key: string]: any;
  };
}

