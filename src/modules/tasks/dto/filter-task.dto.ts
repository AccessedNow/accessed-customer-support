import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TaskStatus, TaskPriority } from 'src/common/enums/task.enum';

export class FilterTaskDto {
  @ApiProperty({
    description: 'Filter tasks by status',
    enum: TaskStatus,
    required: false,
    example: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    description: 'Filter tasks by priority',
    enum: TaskPriority,
    required: false,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Filter tasks by assigned user ID',
    required: false,
    example: '60d21b4667d0d8992e610c85',
  })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
