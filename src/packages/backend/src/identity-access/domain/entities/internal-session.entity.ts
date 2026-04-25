export interface InternalSessionProps {
  id: string;
  userId: string;
  roleIds: string[];
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateInternalSessionProps {
  id: string;
  userId: string;
  roleIds: string[];
  createdAt: Date;
  ttlInMilliseconds: number;
}

export class InternalSession {
  private readonly props: InternalSessionProps;

  private constructor(props: InternalSessionProps) {
    this.props = props;
  }

  static create(props: CreateInternalSessionProps): InternalSession {
    const expiresAt = new Date(props.createdAt.getTime() + props.ttlInMilliseconds);

    return new InternalSession({
      id: props.id,
      userId: props.userId,
      roleIds: props.roleIds,
      createdAt: props.createdAt,
      expiresAt,
      revokedAt: null,
    });
  }

  static rehydrate(props: InternalSessionProps): InternalSession {
    return new InternalSession(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get roleIds(): string[] {
    return this.props.roleIds;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isExpired(at: Date): boolean {
    return at.getTime() >= this.props.expiresAt.getTime();
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  revoke(at: Date): InternalSession {
    return InternalSession.rehydrate({
      ...this.props,
      revokedAt: at,
    });
  }
}
