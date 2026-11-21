import { PetProfileClient } from "./PetProfileClient";

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PetProfileClient id={id} />;
}