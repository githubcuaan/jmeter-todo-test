import { IsIn, ValidateIf } from 'class-validator';

export class ListTodosDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['true', 'false'])
  completed?: string;
}
