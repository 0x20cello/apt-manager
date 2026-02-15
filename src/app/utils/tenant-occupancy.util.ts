import { Tenant } from '../models/apartment.model';

function toDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function parseYmdDate(value: string): Date | null {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function isDateAfterTenantEnd(tenant: Pick<Tenant, 'endDate'>, dateValue: string): boolean {
  if (!tenant.endDate) {
    return false;
  }
  const endDate = parseYmdDate(tenant.endDate);
  const date = parseYmdDate(dateValue);
  if (!endDate || !date) {
    return false;
  }
  return toDateOnly(date).getTime() > toDateOnly(endDate).getTime();
}

export function isTenantContractActive(tenant: Pick<Tenant, 'endDate'>, referenceDate: Date = new Date()): boolean {
  if (!tenant.endDate) {
    return true;
  }
  const endDate = parseYmdDate(tenant.endDate);
  if (!endDate) {
    return true;
  }
  return toDateOnly(endDate).getTime() >= toDateOnly(referenceDate).getTime();
}

export function getActiveTenantsForRoom(
  tenants: Tenant[],
  roomId: string,
  referenceDate: Date = new Date()
): Tenant[] {
  return tenants.filter((tenant) => tenant.roomId === roomId && isTenantContractActive(tenant, referenceDate));
}
