import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import { Student } from './student.model';
import { User } from './user.model';

@Table({ tableName: 'parent_absences', underscored: true, timestamps: true })
export class ParentAbsence extends Model {
  @ForeignKey(() => Student)
  @Column({ type: DataType.INTEGER, allowNull: false })
  student_id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  parent_id!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  absence_date!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  reason?: string | null;

  @Column({
    type: DataType.ENUM('reported', 'acknowledged'),
    allowNull: false,
    defaultValue: 'reported',
  })
  status!: 'reported' | 'acknowledged';

  @BelongsTo(() => Student)
  student!: Student;

  @BelongsTo(() => User)
  parent!: User;
}
