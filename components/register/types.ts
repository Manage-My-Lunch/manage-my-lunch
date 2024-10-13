export type UserData = {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    cpassword: string, // Confirm password
    university: University | null,
    campus: Campus | null
}

export enum Indices {
    NAMES = 0,
    CREDENTIALS = 1,
    UNIVERSITY = 2
}

export type UniversityList = University[]


export type Campus = {
    id: string,
    name: string,
    address_street: string,
    address_suburb: string,
    address_city: string
}

export type University = {
    id: string,
    name: string,
    abbreviation: string,
    campus: Campus[]
}