import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { RouteRun } from './routeRun.model';
import { Student } from './student.model';

@Table({ tableName: 'route_run_assignments', underscored: true })
export class RouteRunAssignment extends Model {
  @ForeignKey(() => RouteRun)
  @Column({ type: DataType.INTEGER, allowNull: false })
  route_run_id!: number;

  @ForeignKey(() => Student)
  @Column({ type: DataType.INTEGER, allowNull: false })
  student_id!: number;

  @Column({ type: DataType.DECIMAL(10, 8), allowNull: true })
  pickup_latitude?: number;

  @Column({ type: DataType.DECIMAL(11, 8), allowNull: true })
  pickup_longitude?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  pickup_order?: number;

  @BelongsTo(() => RouteRun)
  routeRun!: RouteRun;

  @BelongsTo(() => Student)
  student!: Student;
}
