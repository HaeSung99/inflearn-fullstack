import bcrypt from "bcryptjs";

export function soltAndHashPassword(password: string): string {
    const salt = 10;
    const hash = bcrypt.hashSync(password, salt)

    return hash

}

export function comparePassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword)
}