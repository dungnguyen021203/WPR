-- Create database


create table if not exists User(
    user_id int auto_increment,
    user_email varchar (300),
    user_password varchar(300),
    user_name varchar(300),
    primary key(user_id),
    unique (user_email)
);

create table if not exists Message(
    mes_id int auto_increment,
    mes_sender_id int,
    mes_receiver_id int,
    title varchar(300) default "No subject",
    mes_body text,
    file varchar(300),
    primary key (mes_id),
    foreign key (mes_sender_id) references User(user_id),
    foreign key (mes_receiver_id) references User(user_id)
);

insert into
    User(user_email, user_password, user_name)
values
    ("a@a.com","aaaaaa", "a@a"),
    ("Micheal@hotmail.com","michael123", "Micheal"),
    ("Jacson@hotmail.com","jacson123", "Jacson");

insert into
    Message(mes_sender_id, mes_receiver_id, title, mes_body, file)
values
    (1, 2, default, "Welcome to the Zoo", default),
    (2, 1, "Greetings", "Hi, whatsup a@a", default),
    (1, 3, "Goodbye", "Bye Bye", default),
    (3, 1, "Meetings", "You must go to school", default),
    (2, 3, "Apointment", "You have an appointment with a doctor", default),
    (3, 2, "Funeral", "You must be at the funeral at 7:30 am", default);