import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { Bus } from './bus.model';
import { RouteAssignment } from './routeAssignment.model';

@Table({ tableName: 'routes', underscored: true })
export class Route extends Model {
  @ForeignKey(() => Bus)
  @Column({ type: DataType.INTEGER, allowNull: false })
  bus_id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.TIME, allowNull: true })
  start_time?: string;

  @Column({ type: DataType.TIME, allowNull: true })
  end_time?: string;

  @Column({
    type: DataType.ENUM('assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'assigned',
  })
  lifecycle_status!: 'assigned' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled';

  @Column({ type: DataType.DATE, allowNull: true })
  accepted_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  arrived_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  picked_up_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  completed_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  cancelled_at?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  cancel_reason?: string;

  @BelongsTo(() => Bus)
  bus!: Bus;

  @HasMany(() => RouteAssignment)
  routeAssignments!: RouteAssignment[];
}

