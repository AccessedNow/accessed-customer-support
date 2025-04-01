import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { TaskStatus, TaskPriority } from 'src/common/enums/task.enum';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Follow up with customer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Call the customer to follow up on their issue',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
    default: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Task due date',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiProperty({ description: 'Associated ticket ID', example: '60d21b4667d0d8992e610c85' })
  @IsOptional()
  @IsString()
  ticket?: string;

  @ApiProperty({
    description: 'Assigned user ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
