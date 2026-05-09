import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'driver_profiles', underscored: true, timestamps: true })
export class DriverProfile extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  user_id!: number;

  @Column({
    type: DataType.ENUM('pending_verification', 'active', 'rejected', 'suspended'),
    allowNull: false,
    defaultValue: 'pending_verification',
  })
  onboarding_status!: 'pending_verification' | 'active' | 'rejected' | 'suspended';

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  first_login_pending!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  verified_at?: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  verified_by?: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  rejected_reason?: string | null;

  @BelongsTo(() => User, 'user_id')
  user!: User;
}
