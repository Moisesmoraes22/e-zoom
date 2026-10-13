-- "Animais" becomes "Pet" (rations, beds, accessories, medicine); the slug and the links stay.
update public.categories set name = 'Pet' where slug = 'animais';
