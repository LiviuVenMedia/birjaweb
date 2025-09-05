export type Role = 'EMPLOYER' | 'SEEKER';

export interface User {
	id: string;
	username: string;
	role: Role;
	token?: string;
}

export interface Vacancy {
	id: number;
	ownerId: string;
	title: string;
	text: string;
	region: string;
	salary?: string;
}

export interface ApplicationItem {
	id?: number;
	offerId?: number | null;
	name: string;
	phone: string;
	region: string;
	interest?: string;
	applicantId?: string;
	offer?: Vacancy;
}

