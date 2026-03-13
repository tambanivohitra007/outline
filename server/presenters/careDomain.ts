import type { CareDomain } from "@server/models";

export default function presentCareDomain(careDomain: CareDomain) {
  return {
    id: careDomain.id,
    name: careDomain.name,
    slug: careDomain.slug,
    description: careDomain.description,
    icon: careDomain.icon,
    color: careDomain.color,
    sortOrder: careDomain.sortOrder,
    createdAt: careDomain.createdAt,
    updatedAt: careDomain.updatedAt,
  };
}
