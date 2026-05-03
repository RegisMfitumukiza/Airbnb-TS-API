import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { Prisma, Role } from "../generated/prisma/client.js";

type CreateUserData = Prisma.UserCreateInput & {
    confirmPassword?: string;
}   

type UpdateUserData = Prisma.UserUpdateInput;

const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    username: true,
    phone: true,
    role: true,
    avatar: true,
    bio: true,
    createdAt: true,
    updatedAt: true
};

type GetUserOptions = {
    skip: number,
    limit: number,
    where?: Prisma.UserWhereInput;
    sortBy?: string,
    sortOrder: "asc" | "desc"
}


export const createUserService = async (data: CreateUserData) => {

    // destructure confirmed password out, and collect the rest of the data in userData

    const { confirmPassword, password, ...userData } = data;

    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
        data: {
            ...userData,
            password: hashedPassword,
            role: data.role ?? Role.GUEST
        },
        select: safeUserSelect
    });
};

export const getAllUsersService = async ({ skip, limit, where = {}, sortBy = "createdAt", sortOrder  }: GetUserOptions) => {
    return await prisma.user.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
            [sortBy]: sortOrder
        },
        select: {
            ...safeUserSelect,
            listings: true,
            bookings: true,
            reviews: true
        },
    });
};

export const countUsersService = async ( where?: Prisma.UserWhereInput) => {
    return prisma.user.count({where});
}

export const getUserByIdService = async (id: string) => {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            ...safeUserSelect,
            listings: true,
            bookings: true,
            reviews: true
        }
    });
};

export const updateUserService = async (
    id: string,
    data: UpdateUserData
) => {
    const updatedData: Prisma.UserUpdateInput = { ...data };

    if (typeof updatedData.password === "string") {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }

    return await prisma.user.update({
        where: { id },
        data: updatedData,
        select: safeUserSelect
    });
};

export const deleteUserService = async (id: string) => {
    return await prisma.user.delete({
        where: { id },
        select: safeUserSelect
    });
};


export const getUserImageDataService = async (id: string) => {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            avatar: true,
            avatarPublicId: true
        }
    });
}


export const updateUserAvatarService = async (
    id: string,
    avatar: string,
    avatarPublicId: string
) => {
    return await prisma.user.update({
        where: { id },
        data: {
            avatar,
            avatarPublicId
        },
        select: safeUserSelect
    })
};

export const deleteUserAvatarService = async (
    id: string
) => {
    return await prisma.user.update({
        where : { id },
        data: {
            avatar: null,
            avatarPublicId: null
        },
        select: safeUserSelect
    })
};


export const getUserStatsService = async () => {
    const totalUsers = await prisma.user.count();

    const usersByRole = await prisma.user.groupBy({
        by: ["role"],
        _count: {
            role: true
        }
    });

    return {
        totalUsers,
        usersByRole : usersByRole.map((item) => ({
            role: item.role,
            count: item._count.role
        }))
    }
};
