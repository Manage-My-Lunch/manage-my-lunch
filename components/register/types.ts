// User registration data
export type UserData = {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    cpassword: string, // Confirm password
    university: University | null,
    campus: Campus | null
}

// List of universities and their campuses
export type UniversityList = University[]

// Campus
export type Campus = {
    id: string,
    name: string,
    address_street: string,
    address_suburb: string,
    address_city: string
}

// University
export type University = {
    id: string,
    name: string,
    abbreviation: string,
    campus: Campus[]
}