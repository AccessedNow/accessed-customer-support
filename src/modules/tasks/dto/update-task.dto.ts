import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from 'src/common/enums/task.enum';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.COMPLETED,
    required: false,
  })
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
    required: false,
  })
  @IsString()
  @IsOptional()
  priority: string;

  @ApiProperty({
    description: 'Task due date',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  dueDate: string;

  @ApiProperty({
    description: 'Task completion date',
    example: '2023-12-30T10:00:00.000Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  completedAt: string;

  @ApiProperty({
    description: 'Assigned user ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsString()
  @IsOptional()
  assignedTo: string;
}
