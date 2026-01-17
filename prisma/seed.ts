import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import pg from 'pg'
import { roleSuperAdmin, userSuperAdmin } from "./data-seed"
import { PrismaClient } from "./generated/client"
import { permissions, PermissionSeed } from "./permission"

const { Pool } = pg
console.log(process.env.DATABASE_URL)
const connectionString = process.env.DATABASE_USER ? `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public` : process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const seedPermissions = async (permissionsArray: PermissionSeed[]) => {
    await Promise.all(
        permissionsArray.map((permission) =>
            prisma.permission
                .upsert({
                    where: {
                        code: permission.code,
                    },
                    create: {
                        code: permission.code,
                    },
                    update: {},
                })
                .then(() => console.log(`Permission "${permission.code}" seeded`)),
        ),
    )
}

const seedAdminRole = async () => {
    await prisma.role.upsert({
        where: {
            id: roleSuperAdmin.id,
        },
        create: {
            id: roleSuperAdmin.id,
            name: roleSuperAdmin.name,
            description: roleSuperAdmin.description,
            Permissions: {
                connect: permissions.map((permission) => {
                    return { code: permission.code }
                }),
            },
        },
        update: {
            name: roleSuperAdmin.name,
            description: roleSuperAdmin.description,
            Permissions: {
                set: permissions.map((permission) => {
                    return { code: permission.code }
                }),
            },
        },
    })
    console.log(`Role "Super Admin" seeded`)
}

const seedEntity = async ({ id, name }: { id: string; name: string }) => {
    await prisma.entity.upsert({
        where: {
            id,
        },
        create: {
            id,
            name,
        },
        update: {
            name,
        },
    })
    console.log(`Entity "admin" seeded`)
}

const seedAdminUser = async () => {
    const allEntities = await prisma.entity.findMany()

    await prisma.user.upsert({
        where: {
            id: userSuperAdmin.id,
        },
        create: {
            id: userSuperAdmin.id,
            name: userSuperAdmin.name,
            email: userSuperAdmin.email,
            emailVerified: true,
            active: true,
            entitySelectedId: "cm8skzpbi0001e58ge65z1rkz",
            Entities: {
                connect: allEntities.map((entity) => {
                    return { id: entity.id }
                }),
            },
            Roles: {
                connect: {
                    id: roleSuperAdmin.id,
                },
            },
            accounts: {
                create: {
                    id: userSuperAdmin.accountId,
                    accountId: userSuperAdmin.id,
                    providerId: "credential",
                    password: userSuperAdmin.password,
                },
            },
        },
        update: {
            name: userSuperAdmin.name,
            emailVerified: true,
            active: true,
            entitySelectedId: allEntities[0].id,
            Roles: {
                set: {
                    id: roleSuperAdmin.id,
                },
            },
            Entities: {
                set: allEntities.map((entity) => {
                    return { id: entity.id }
                }),
            },
            accounts: {
                upsert: {
                    where: {
                        id: userSuperAdmin.accountId,
                    },
                    create: {
                        id: userSuperAdmin.accountId,
                        accountId: userSuperAdmin.id,
                        providerId: "credential",
                        password: userSuperAdmin.password,
                    },
                    update: {
                        accountId: userSuperAdmin.id,
                        providerId: "credential",
                        password: userSuperAdmin.password,
                    },
                },
            },
        },
    })

    console.log(`User "Super Admin" seeded`)
}

async function main() {
    console.log(" ===== Start Seeding ===== \n")
    console.log(" == Seeding Permission == \n")
    await seedPermissions(permissions)
    console.log("\n == Seeding Admin Role == \n")
    await seedAdminRole()
    console.log("\n == Seeding Admin Entity == \n")
    await seedEntity({
        id: "cm8skzpbi0001e58ge65z1rkz",
        name: "Entity 1",
    })
    await seedEntity({
        id: "cmdz8e2or000008jsfl42208j",
        name: "Entity 2",
    })
    console.log("\n == Seeding Admin User == \n")
    await seedAdminUser()
    console.log("\n ===== End Seeding ===== \n")
}

main()
    .then(() => {
        prisma.$disconnect()
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
