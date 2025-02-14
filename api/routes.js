module.exports = function (app) {
    const Home = require('../api/routes/Home');
    app.use('/', Home);

    const Role = require('../api/routes/Role');
    app.use('/role', Role);

    const Page = require('../api/routes/RolePage');
    app.use('/page', Page);

    const Organization = require('../api/routes/Organization');
    app.use('/organization', Organization);

    const User = require('../api/routes/User');
    app.use('/user', User);

    const Feedback = require('../api/routes/Feedback');
    app.use('/feedback', Feedback);

    const Header = require('../api/routes/Header');
    app.use('/header', Header);

    const Content = require('./routes/Content');
    app.use('/content', Content);

    let Email = require('../api/routes/Email');
    app.use('/email', Email);

    let Image = require('../api/routes/Image');
    app.use('/image', Image);

    let Category = require('../api/routes/Category');
    app.use('/category', Category);

    let Location = require('../api/routes/Location');
    app.use('/location', Location);

    let Form = require('../api/routes/Form');
    app.use('/form', Form);

    let Footer = require('../api/routes/Footer');
    app.use('/footer', Footer);
}
