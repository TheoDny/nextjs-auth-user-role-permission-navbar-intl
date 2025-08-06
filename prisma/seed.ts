import { PrismaClient } from "./generated"
import { permissions, PermissionSeed } from "./permission"

const prisma = new PrismaClient()

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
            id: "cm8q88831000008jo38u2f5os",
        },
        create: {
            id: "cm8q88831000008jo38u2f5os",
            name: "Super Admin",
            description: "Role administreur with every permission",
            Permissions: {
                connect: permissions.map((permission) => {
                    return { code: permission.code }
                }),
            },
        },
        update: {
            name: "Super Admin",
            description: "Role administreur with every permission",
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
            id: "UOOl0OSwsUWelQZxSOK8RxaOtb5dS71b",
        },
        create: {
            id: "UOOl0OSwsUWelQZxSOK8RxaOtb5dS71b",
            name: "Super Admin",
            email: "admin@admin.com",
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
                    id: "cm8q88831000008jo38u2f5os",
                },
            },
            accounts: {
                create: {
                    id: "UOOl0ORrsVWalQUxSOK8RxaKtd8dT41b",
                    accountId: "UOOl0OSwsUWelQZxSOK8RxaOtb5dS71b",
                    providerId: "credential",
                    password:
                        "8c81a7feb9c84a593256e8bf03d5b4cf:69dcb20421f122088432d100e19fbdde223aa5c6948ec3b72868cffd71be69b477282879fb1f2ddf1aaaf260a75b525c7ec762e6a89e57cd0a8ab934f357f462",
                },
            },
        },
        update: {
            name: "Super Admin",
            emailVerified: true,
            active: true,
            entitySelectedId: "cm8skzpbi0001e58ge65z1rkz",
            Roles: {
                set: {
                    id: "cm8q88831000008jo38u2f5os",
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
                        id: "UOOl0ORrsVWalQUxSOK8RxaKtd8dT41b",
                    },
                    create: {
                        id: "UOOl0ORrsVWalQUxSOK8RxaKtd8dT41b",
                        accountId: "UOOl0OSwsUWelQZxSOK8RxaOtb5dS71b",
                        providerId: "credential",
                        password:
                            "8c81a7feb9c84a593256e8bf03d5b4cf:69dcb20421f122088432d100e19fbdde223aa5c6948ec3b72868cffd71be69b477282879fb1f2ddf1aaaf260a75b525c7ec762e6a89e57cd0a8ab934f357f462",
                    },
                    update: {
                        accountId: "UOOl0OSwsUWelQZxSOK8RxaOtb5dS71b",
                        providerId: "credential",
                        password:
                            "8c81a7feb9c84a593256e8bf03d5b4cf:69dcb20421f122088432d100e19fbdde223aa5c6948ec3b72868cffd71be69b477282879fb1f2ddf1aaaf260a75b525c7ec762e6a89e57cd0a8ab934f357f462",
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
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        // process.exit(1);
    })
