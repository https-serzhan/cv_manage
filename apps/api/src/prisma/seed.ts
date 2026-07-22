import { AttributeType, PositionAccessMode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { code: "CANDIDATE", name: "Candidate" },
  { code: "RECRUITER", name: "Recruiter" },
  { code: "ADMIN", name: "Admin" }
] as const;

const attributeCategories = [
  "Personal Information",
  "Certification",
  "Domain Knowledge",
  "Soft Skills",
  "Technical Skills",
  "Language",
  "Education",
  "Other"
] as const;

const demoAttributes = [
  {
    category: "Personal Information",
    name: "Phone",
    description: "Primary contact phone number.",
    type: AttributeType.STRING
  },
  {
    category: "Personal Information",
    name: "LinkedIn",
    description: "Public LinkedIn profile URL.",
    type: AttributeType.STRING
  },
  {
    category: "Personal Information",
    name: "GitHub",
    description: "Public GitHub profile URL.",
    type: AttributeType.STRING
  },
  {
    category: "Technical Skills",
    name: "Years of Experience",
    description: "Total relevant professional experience.",
    type: AttributeType.NUMERIC
  },
  {
    category: "Language",
    name: "English Level",
    description: "Candidate English proficiency level.",
    type: AttributeType.DROPDOWN,
    options: ["A1", "A2", "B1", "B2", "C1", "C2"]
  },
  {
    category: "Technical Skills",
    name: "Primary Technology",
    description: "Main technology or stack for the candidate.",
    type: AttributeType.STRING
  },
  {
    category: "Personal Information",
    name: "Professional Summary",
    description: "Short professional summary for CV previews.",
    type: AttributeType.TEXT
  },
  {
    category: "Personal Information",
    name: "Profile Image",
    description: "External profile image URL.",
    type: AttributeType.IMAGE
  },
  {
    category: "Personal Information",
    name: "Available From",
    description: "Date when the candidate is available to start.",
    type: AttributeType.DATE
  },
  {
    category: "Education",
    name: "Education Period",
    description: "Start and end dates for a relevant education period.",
    type: AttributeType.PERIOD
  },
  {
    category: "Personal Information",
    name: "Open to Relocation",
    description: "Whether the candidate is open to relocation.",
    type: AttributeType.BOOLEAN
  }
] as const;

const demoTagNames = [
  "TypeScript",
  "React",
  "Node.js",
  "PostgreSQL",
  "Python",
  "Data Engineering",
  "Java",
  "AWS"
] as const;

const demoPositions = [
  {
    title: "Senior Data Engineer",
    description:
      "Public position for candidates with Python, data engineering, and database experience.",
    accessMode: PositionAccessMode.PUBLIC,
    maxProjects: 3,
    attributes: [
      { name: "Professional Summary", isRequired: true },
      { name: "Years of Experience", isRequired: true },
      { name: "Primary Technology", isRequired: true },
      { name: "English Level", isRequired: false },
      { name: "GitHub", isRequired: false }
    ],
    projectTagNames: ["Python", "Data Engineering"]
  },
  {
    title: "Frontend Engineer",
    description: "Public position focused on React and TypeScript frontend delivery.",
    accessMode: PositionAccessMode.PUBLIC,
    maxProjects: null,
    attributes: [
      { name: "Professional Summary", isRequired: true },
      { name: "Years of Experience", isRequired: true },
      { name: "Primary Technology", isRequired: true },
      { name: "LinkedIn", isRequired: false },
      { name: "English Level", isRequired: false }
    ],
    projectTagNames: ["React", "TypeScript"]
  },
  {
    title: "Restricted Internal Role",
    description: "Restricted position for demonstrating candidate access management.",
    accessMode: PositionAccessMode.RESTRICTED,
    maxProjects: 2,
    attributes: [
      { name: "Professional Summary", isRequired: true },
      { name: "Primary Technology", isRequired: true },
      { name: "Open to Relocation", isRequired: false }
    ],
    projectTagNames: ["AWS", "PostgreSQL"]
  }
] as const;

type SeedAttribute = (typeof demoAttributes)[number];

async function findOrCreateTag(name: string) {
  const existingTag = await prisma.projectTag.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  if (existingTag) {
    return existingTag;
  }

  return prisma.projectTag.create({
    data: { name },
    select: {
      id: true,
      name: true
    }
  });
}

async function seedAttribute(attribute: SeedAttribute, categoryIdByName: Map<string, string>) {
  const categoryId = categoryIdByName.get(attribute.category);

  if (!categoryId) {
    throw new Error(`Missing attribute category: ${attribute.category}`);
  }

  const savedAttribute = await prisma.attribute.upsert({
    where: { name: attribute.name },
    update: {
      categoryId,
      description: attribute.description,
      type: attribute.type
    },
    create: {
      categoryId,
      name: attribute.name,
      description: attribute.description,
      type: attribute.type
    },
    select: {
      id: true
    }
  });

  if ("options" in attribute) {
    for (const [sortOrder, value] of attribute.options.entries()) {
      await prisma.attributeOption.upsert({
        where: {
          attributeId_value: {
            attributeId: savedAttribute.id,
            value
          }
        },
        update: { sortOrder },
        create: {
          attributeId: savedAttribute.id,
          value,
          sortOrder
        }
      });
    }
  }

  return savedAttribute;
}

async function seedPosition(
  position: (typeof demoPositions)[number],
  attributeIdByName: Map<string, string>,
  tagIdByName: Map<string, string>
) {
  const existingPosition = await prisma.position.findFirst({
    where: {
      title: position.title,
      createdById: null
    },
    select: { id: true }
  });
  const savedPosition = existingPosition
    ? await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          description: position.description,
          accessMode: position.accessMode,
          maxProjects: position.maxProjects
        },
        select: { id: true }
      })
    : await prisma.position.create({
        data: {
          title: position.title,
          description: position.description,
          accessMode: position.accessMode,
          maxProjects: position.maxProjects,
          createdById: null
        },
        select: { id: true }
      });

  await prisma.positionAttribute.deleteMany({
    where: { positionId: savedPosition.id }
  });
  await prisma.positionProjectTag.deleteMany({
    where: { positionId: savedPosition.id }
  });

  if (position.accessMode === PositionAccessMode.PUBLIC) {
    await prisma.positionCandidateAccess.deleteMany({
      where: { positionId: savedPosition.id }
    });
  }

  await prisma.positionAttribute.createMany({
    data: position.attributes.map((attribute, sortOrder) => {
      const attributeId = attributeIdByName.get(attribute.name);

      if (!attributeId) {
        throw new Error(`Missing position attribute: ${attribute.name}`);
      }

      return {
        positionId: savedPosition.id,
        attributeId,
        sortOrder,
        isRequired: attribute.isRequired
      };
    })
  });

  await prisma.positionProjectTag.createMany({
    data: position.projectTagNames.map((tagName) => {
      const tagId = tagIdByName.get(tagName.toLowerCase());

      if (!tagId) {
        throw new Error(`Missing project tag: ${tagName}`);
      }

      return {
        positionId: savedPosition.id,
        tagId
      };
    }),
    skipDuplicates: true
  });
}

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role
    });
  }

  await prisma.attributeCategory.createMany({
    data: attributeCategories.map((name) => ({ name })),
    skipDuplicates: true
  });

  const categories = await prisma.attributeCategory.findMany({
    where: {
      name: {
        in: [...attributeCategories]
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
  const attributeIdByName = new Map<string, string>();

  for (const attribute of demoAttributes) {
    const savedAttribute = await seedAttribute(attribute, categoryIdByName);
    attributeIdByName.set(attribute.name, savedAttribute.id);
  }

  const tagIdByName = new Map<string, string>();

  for (const tagName of demoTagNames) {
    const tag = await findOrCreateTag(tagName);
    tagIdByName.set(tag.name.toLowerCase(), tag.id);
    tagIdByName.set(tagName.toLowerCase(), tag.id);
  }

  for (const position of demoPositions) {
    await seedPosition(position, attributeIdByName, tagIdByName);
  }

  console.info(
    "Seed completed: roles, categories, demo attributes, tags, and positions are present."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
