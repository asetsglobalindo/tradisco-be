const Role = require("./role");
const RolePage = require("./rolepage");
const Organization = require("./organization");
const User = require("./user");
const PendingMail = require("./pendingmail");
const Feedback = require("./feedback");
const Header = require("./header");
const Content = require("./content");
const Image = require("./image");
const Access = require("./access");
const Email = require("./email");
const Category = require("./category");
const Home = require("./home");
const Location = require("./location");
const City = require("./city");
const Form = require("./form");
const Footer = require("./footer");

const models = {
    Role, Organization, User, RolePage, PendingMail,
    Feedback, Header, Access,
    Content, Email, Image, Category,
    Home, Location, City, Form, Footer
};

module.exports = models;
