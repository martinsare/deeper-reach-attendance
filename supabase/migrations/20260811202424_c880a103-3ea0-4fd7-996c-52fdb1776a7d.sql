CREATE TYPE public.member_gender AS ENUM ('male','female');
ALTER TABLE public.members ADD COLUMN gender public.member_gender;