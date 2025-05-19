import { IsOptional, IsString } from 'class-validator';

export class CustomerInfoDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  firstName?: string; //

  @IsString()
  @IsOptional()
  lastName?: string; //

  @IsString()
  @IsOptional()
  email?: string; //

  @IsString()
  @IsOptional()
  phoneNumber?: string; //

  @IsString()
  @IsOptional()
  isoCode2?: string; //

  @IsString()
  @IsOptional()
  country?: string; //

  @IsString()
  @IsOptional()
  countryCode?: string; //

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  stateCode?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  partyId?: string;

  @IsString()
  @IsOptional()
  partyType?: string; //

  @IsString()
  @IsOptional()
  nameOfOrganization?: string;

  @IsString()
  @IsOptional()
  partyName?: string;
}

export const CUSTOMER_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'isoCode2',
  'country',
  'countryCode',
  'state',
  'stateCode',
  'city',
  'postalCode',
  'timezone',
  'partyId',
  'partyType',
  'nameOfOrganization',
  'partyName',
  'customerId',
];
