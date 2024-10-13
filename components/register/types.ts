export type UserData = {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    cpassword: string, // Confirm password
    university: number,
    campus: number
}

export enum Indices {
    NAMES = 0,
    CREDENTIALS = 1,
    UNIVERSITY = 2
}

export type UniversityList = {
    id: string,
    name: string,
    abbreviation: string,
    campus: {
        id: string,
        name: string
    }[]
}[]