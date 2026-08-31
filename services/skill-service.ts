import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Skill, type SkillDocument } from "@/models/skill"
import type { Skill as SkillDTO, SkillCategory } from "@/types/skill"

export type CreateSkillInput = {
  name: string
  category: SkillCategory
  aliases?: string[]
}

function toSkillDTO(skill: SkillDocument): SkillDTO {
  return {
    id: toStringId(skill._id),
    name: skill.name,
    category: skill.category,
    aliases: skill.aliases ?? [],
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  }
}

export async function createSkill(input: CreateSkillInput): Promise<SkillDTO> {
  await dbConnect()
  const skill = await Skill.create({
    name: input.name.trim(),
    category: input.category,
    aliases: input.aliases ?? [],
  })
  return toSkillDTO(skill)
}

export async function getSkillByName(name: string): Promise<SkillDTO | null> {
  await dbConnect()
  const skill = await Skill.findOne({
    $or: [{ name }, { aliases: name }],
  })
  return skill ? toSkillDTO(skill) : null
}

export async function listSkillsByCategory(
  category?: SkillCategory
): Promise<SkillDTO[]> {
  await dbConnect()
  const query = category ? { category } : {}
  const skills = await Skill.find(query).sort({ name: 1 })
  return skills.map(toSkillDTO)
}

export async function listSkills(): Promise<SkillDTO[]> {
  return listSkillsByCategory()
}
