const {
  generateRandomString,
  removeEnter,
  denormalizeComaString,
  generateRandomNumber,
  revertWordBreak,
} = require("../helper/stringmod");
const {
  newUserMailContent,
  newUserMailSubject,
  newUserMailContentV2,
  newUserMailContentV3,
  forgotPasswordSubject,
  forgotPasswordContent,
} = require("../mail/newuser");
const { content } = require("../mail/email");
const {
  createToken,
  createTokenVerify,
  userFirstLastName,
  googleTokenCheck,
} = require("../helper/userHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const response = require("../helper/response");
const models = require("../models");
const { i18n } = require("../locales");

const User = {
  get: async function (req, res) {
    const { page = 1, limit = 500 } = req.query;

    const attributes = `name email active_status phone_number created_at updated_at role_id`;
    const sort = {
      sort: { updated_at: -1 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };
    const filter = {
      "organizations.organization_id": req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    };
    const populate = [
      { path: `role_id`, match: { deleted_time: { $exists: false } } },
    ];
    const users = await models.User.find(filter, attributes, sort).populate(
      populate
    );
    const total_data = await models.User.countDocuments(filter);
    const pages = {
      current_page: parseInt(page),
      total_data,
    };
    return response.ok(users, res, `Success`, pages);
  },
  getDetail: async function (req, res) {
    const { user_id } = req.params;
    const user = await models.User.findOne({
      _id: user_id,
      "organizations.organization_id": req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    });
    if (!user) {
      return response.error(400, `User not found`, res, `User not found`);
    }

    const full_name = userFirstLastName(user);
    const data = {
      ...user._doc,
      first_name: full_name?.first_name,
      last_name: full_name?.last_name,
    };

    return response.ok(
      data,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  // New function to count users
  countUsers: async function (req, res) {
    try {
      // Create the filter to count users based on organization and deleted status
      const filter = {
        "organizations.organization_id": req.me.organization_id, // Filter by the user's organization
        deleted_time: { $exists: false }, // Exclude users that have been deleted
      };

      // Count the number of users that match the filter
      const userCount = await models.User.countDocuments(filter);

      // Return the result in the response
      return response.ok({ user_count: userCount }, res, "Success");
    } catch (err) {
      // Handle errors and return an error response
      return response.error(400, err.message, res, err);
    }
  },
  activateUser: async function (req, res) {
    const { token } = req.params;
    const current_date = moment().tz("Asia/Jakarta").format();

    const decoded_token = jwt.verify(token, process.env.SECRET);

    await models.User.findOneAndUpdate(
      {
        _id: decoded_token._id,
        deleted_time: {
          $exists: false,
        },
      },
      {
        active_status: true,
        updated_at: current_date,
      }
    );

    return response.redirect(`${process.env.DOMAIN_WEB}/sign-in`, res);
  },
  add: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    const {
      name,
      password,
      email,
      dob,
      phone_number,
      addresses = [],
      active_status,
      description,
      gender,
      role_id,
      user_level = "super_admin",
    } = req.body;
    const organization_id = req?.me?.organization_id;
    // const host = req.headers?.host || null;
    // const user_level = host.includes('backoffice') ? `admin` : `user`;

    const original_password = password ? password : generateRandomString(8);
    const hashed_password = await bcrypt.hash(original_password, 10);

    //check another email or phone number
    if (!email)
      return response.error(
        400,
        `Please input email`,
        res,
        `Please input email`
      );
    // if (!phone_number) return response.error(400, `Please input phone number`, res, `Please input phone number`);

    const users = await models.User.find(
      {
        deleted_time: {
          $exists: false,
        },
      },
      `email phone_number`
    );

    const existing_email = users.find(
      (item) => item.email.trim().toUpperCase() == email.trim().toUpperCase()
    );
    if (existing_email) {
      return response.error(
        400,
        `Email already used by another user`,
        res,
        `Email already used by another user`
      );
    }

    if (phone_number) {
      const existing_phone_number = users.find(
        (item) =>
          item?.phone_number?.trim().toUpperCase() ==
          phone_number.trim().toUpperCase()
      );
      if (existing_phone_number) {
        return response.error(
          400,
          `Phone number already used by another user`,
          res,
          `Phone number already used by another user`
        );
      }
    }

    //find role id
    let filter_role = {
      deleted_time: {
        $exists: false,
      },
    };
    if (role_id) filter_role._id = role_id;
    else {
      filter_role.default_name = user_level;
    }
    const role = await models.Role.findOne(filter_role, `_id default_role`);
    if (!role)
      return response.error(400, `Role not found`, res, `Role not found`);
    const session = await models.User.startSession();
    session.startTransaction();

    try {
      const options = { session };

      let new_data = {
        name,
        email,
        description,
        gender,
        addresses,
        role_id: role?._id ?? null,
        phone_number,
        active_status,
        password: hashed_password,
      };
      if (dob)
        new_data.dob = moment(dob).tz("Asia/Jakarta").startOf("day").format();

      if (organization_id) {
        let organizations = [];
        organizations.push({
          organization_id,
        });
        new_data.organizations = organizations;
      }

      const user = await models.User(new_data).save(options);

      //create token for activation
      // const token = await createTokenVerify({_id: user._id}, process.env.SECRET, 1800)
      // const link = `${process.env.API_URL}/user/activate?token=${token}`
      let mail_data = {
        name: user.name,
        original_password,
        // link
      };
      let type_email = 14;

      //create admin in organization
      if (user_level == `super_admin` || role?.default_role) {
        const organization = await models.Organization.findOne(
          {
            _id: organization_id,
            deleted_time: {
              $exists: false,
            },
          },
          `admins`
        );
        const exists_admin = organization.admins.find(
          (item) => item == user._id
        );
        if (!exists_admin) {
          let new_admin = organization.admins;
          new_admin.push(user._id);
          organization.admins = new_admin;
          await organization.save(options);
        }

        delete mail_data.link;
        // type_email=14;
      }

      //send email
      // const body_user = await content(user.email, organization_id, type_email, mail_data);
      // if (body_user) await models.PendingMail(body_user).save(options);

      await session.commitTransaction();
      session.endSession();

      return response.ok(
        user,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  register: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();

    const {
      email,
      password,
      confirm_password,
      phone_number,
      first_name,
      last_name,
      organization_id,
      dob,
    } = req.body;

    //check another email or phone number
    if (!email)
      return response.error(
        400,
        `Please input email`,
        res,
        `Please input email`
      );
    // if (!phone_number) return response.error(400, `Please input phone number`, res, `Please input phone number`);

    const users = await models.User.find(
      {
        deleted_time: {
          $exists: false,
        },
      },
      `email phone_number`
    );

    const existing_email = users.find(
      (item) => item.email.trim().toUpperCase() == email.trim().toUpperCase()
    );
    if (existing_email) {
      return response.error(
        400,
        `Email already used by another user`,
        res,
        `Email already used by another user`
      );
    }

    if (phone_number) {
      const existing_phone_number = users.find(
        (item) =>
          item?.phone_number?.trim().toUpperCase() ==
          phone_number.trim().toUpperCase()
      );
      if (existing_phone_number) {
        return response.error(
          400,
          `Phone number already used by another user`,
          res,
          `Phone number already used by another user`
        );
      }
    }

    if (password != confirm_password)
      return response.error(
        400,
        `Password not match`,
        res,
        `Password not match`
      );
    if (password.length < 7 || confirm_password.length < 7)
      return response.error(
        400,
        `Password should min. 7 character`,
        res,
        `Password should min. 7 character`
      );

    const hashed_password = await bcrypt.hash(password, 10);

    //find member id
    // const member_info = await memberInfo(0, organization_id);
    // let member_id = member_info.length > 0 ? member_info[0]._id : null;

    const session = await models.User.startSession();
    session.startTransaction();

    try {
      const options = { session };

      //find role id for user
      const role = await models.Role.findOne(
        {
          default_name: "user",
          default_role: false,
          deleted_time: {
            $exists: false,
          },
        },
        `_id`
      );

      let new_data = {
        name: `${first_name} ${last_name}`,
        email,
        role_id: role?._id ?? null,
        phone_number,
        password: hashed_password,
        active_status: false,
      };
      // if (member_id) new_data.member_id = member_id;

      if (dob)
        new_data.dob = moment(dob).tz("Asia/Jakarta").startOf("day").format();
      if (organization_id) {
        let organizations = [];
        organizations.push({
          organization_id,
        });
        new_data.organizations = organizations;
      }
      const user = await models.User(new_data).save(options);

      //create token for activation
      const token = await createTokenVerify(
        { _id: user._id },
        process.env.SECRET,
        1800
      );
      const link = `${process.env.API_URL}/user/activate/${token}`;

      //send email
      const body_user = await content(user.email, organization_id, 13, {
        name: user.name,
        password,
        link,
      });
      if (body_user) await models.PendingMail(body_user).save(options);

      await session.commitTransaction();
      session.endSession();

      return response.ok(
        user,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  login: async function (req, res) {
    const { email, password, phone_number } = req.body;
    const user = await models.User.findByLogin(email.trim());

    if (!user) {
      return response.error(400, `Email not found`, res, `Email not found`);
    }

    const organization_id = user?.organizations[0]?.organization_id;

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return response.error(400, `Invalid password.`, res, `Invalid password.`);
    }

    const full_name = userFirstLastName(user);
    let user_obj = JSON.parse(JSON.stringify(user));
    if (user_obj?.role_id)
      user_obj.role_id.permissions = user_obj?.role_id?.permissions.sort(
        (a, b) => (a.page_id.order > b.page_id.order ? 1 : -1)
      );
    delete user_obj.password;
    const user_detail = {
      ...user_obj,
      first_name: full_name?.first_name,
      last_name: full_name?.last_name,
    };
    const data = {
      token: await createToken(
        user,
        organization_id,
        process.env.SECRET,
        "30 days"
      ),
      user: user_detail,
    };

    //create activity log

    return response.ok(
      data,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  update: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    const {
      user_id,
      name,
      email,
      addresses = [],
      phone_number,
      dob,
      active_status,
      role_id,
      description,
      gender,
      member_id,
    } = req.body;

    let flag_update_password = 0;

    if (!user_id)
      return response.error(400, `User not found`, res, `User not found`);

    const user = await models.User.findOne({
      _id: user_id,
      "organizations.organization_id": req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    });

    if (!user) {
      return response.error(400, `User not found`, res, `User not found`);
    }

    const original_password = generateRandomString(8);
    const hashed_password = await bcrypt.hash(original_password, 10);

    //check another email or phone number
    if (email != user.email) {
      const existing_email = await models.User.findOne({
        email,
        deleted_time: {
          $exists: false,
        },
        _id: {
          $nin: [user_id],
        },
      });
      if (existing_email) {
        return response.error(
          400,
          `Email already used by another user`,
          res,
          `Email already used by another user`
        );
      }
      user.password = hashed_password;
    }

    if (phone_number != user.phone_number) {
      const existing_email = await models.User.findOne({
        phone_number,
        deleted_time: {
          $exists: false,
        },
        _id: {
          $nin: [user_id],
        },
      });
      if (existing_email) {
        return response.error(
          400,
          `Phone number already used by another user`,
          res,
          `Phone number already used by another user`
        );
      }
      user.password = hashed_password;
      flag_update_password++;
    }

    user.name = name;
    user.email = email;
    user.description = description;
    user.gender = gender;
    user.phone_number = phone_number;
    user.active_status = active_status;
    user.updated_at = current_date;
    user.updated_by = req.me._id;
    user.addresses = addresses;
    if (dob) user.dob = moment(dob).tz("Asia/Jakarta").startOf("day").format();
    if (member_id) user.member_id = member_id;
    if (role_id) user.role_id = role_id;
    await user.save();

    //send email
    if (flag_update_password) {
      const body_user = await content(user.email, req.me.organization_id, 14, {
        name: user.name,
        original_password,
      });
      if (body_user) await models.PendingMail(body_user).save();
    }

    //find role id
    if (role_id) {
      const role = await models.Role.findOne(
        {
          _id: role_id,
          deleted_time: {
            $exists: false,
          },
        },
        `default_name default_role`
      );

      //create admin in organization
      if (role?.default_name == `admin` || role.default_role) {
        const organization = await models.Organization.findOne(
          {
            _id: req.me.organization_id,
            deleted_time: {
              $exists: false,
            },
          },
          `admins`
        );
        const exists_admin = organization.admins.find(
          (item) => item == user._id
        );
        if (!exists_admin) {
          let new_admin = organization.admins;
          new_admin.push(user._id);
          organization.admins = new_admin;
          await organization.save();
        }
      } else {
        await models.Organization.updateOne(
          {
            _id: req.me.organization_id,
            deleted_time: {
              $exists: false,
            },
          },
          {
            $pull: {
              admins: { $in: [user._id] },
            },
          }
        );
      }
    }

    return response.ok(
      user,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  delete: async function (req, res) {
    const { user_id } = req.body;
    if (user_id.includes(req.me._id?.toString()))
      return response.error(
        400,
        `You cannot delete yourself`,
        res,
        `You cannot delete yourself`
      );

    const session = await models.User.startSession();
    session.startTransaction();

    try {
      const current_date = moment().tz("Asia/Jakarta").format();
      const options = { session };

      await models.User.updateMany(
        {
          _id: {
            $in: user_id,
          },
          "organizations.organization_id": req.me.organization_id,
          deleted_time: {
            $exists: false,
          },
        },
        {
          deleted_time: current_date,
          deleted_by: req.me._id,
          updated_at: null,
          updated_by: null,
        },
        options
      );

      await models.Organization.updateOne(
        {
          _id: req.me.organization_id,
          deleted_time: {
            $exists: false,
          },
        },
        {
          $pull: {
            admins: { $in: user_id },
          },
        },
        options
      );

      await session.commitTransaction();
      session.endSession();

      return response.ok(
        true,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  loginThirdParty: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    let { name, email, credential, organization_id, accessToken } = req.body;
    let data;

    if (!organization_id) {
      return response.error(
        400,
        `(403) Something wrong, please contact our admin.`,
        res,
        `(403) Something wrong, please contact our admin.`
      );
    }

    if (accessToken) {
      const auth_user = await googleTokenCheck(accessToken);
      if (auth_user?.status == 400 || !auth_user?.data)
        return response.error(
          400,
          `(403) Something wrong, please check your email.`,
          res,
          `(403) Something wrong, please check your email.`
        );
    }

    if (credential) {
      const decoded = await jwt.decode(credential);
      name = decoded.name;
      email = decoded.email;
    }

    //check email if any in database
    const users = await models.User.find({
      deleted_time: {
        $exists: false,
      },
    });

    const user = users.find(
      (item) => item.email.trim().toLowerCase() == email.trim().toLowerCase()
    );
    if (user) {
      //login
      const full_name = userFirstLastName(user);
      const user_detail = {
        ...user._doc,
        new_user: false,
        first_name: full_name?.first_name,
        last_name: full_name?.last_name,
      };
      data = {
        token: await createToken(
          user,
          user?.organizations[0]?.organization_id,
          process.env.SECRET,
          "30 days"
        ),
        user: user_detail,
      };
      return response.ok(
        data,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } else {
      //find member id
      // const member_info = await memberInfo(0, organization_id);
      // let member_id = member_info.length > 0 ? member_info[0]._id : null;

      //register
      const session = await models.User.startSession();
      session.startTransaction();

      try {
        const options = { session };
        const original_password = generateRandomString(8);
        const hashed_password = await bcrypt.hash(original_password, 10);

        let organizations = [];
        organizations.push({
          organization_id,
        });

        let new_data = {
          name,
          email,
          password: hashed_password,
          organizations,
          active_status: true,
        };
        // if (member_id) new_data.member_id = member_id;

        const user = await models.User(new_data).save(options);
        const full_name = userFirstLastName(user);
        const user_detail = {
          ...user._doc,
          new_user: true,
          first_name: full_name?.first_name,
          last_name: full_name?.last_name,
        };
        data = {
          token: await createToken(
            user,
            organization_id,
            process.env.SECRET,
            "30 days"
          ),
          user: user_detail,
        };

        //send email
        const body_user = await content(user.email, organization_id, 2, {
          name: user.name,
        });
        if (body_user) await models.PendingMail(body_user).save(options);

        await session.commitTransaction();
        session.endSession();

        return response.ok(
          data,
          res,
          i18n(`Success`, {}, req.headers["accept-language"], "general")
        );
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return response.error(400, error.message, res, error);
      }
    }
  },
  sendOtpForgotPassword: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    const { email } = req.body;
    const filter = {
      deleted_time: {
        $exists: false,
      },
    };
    const users = await models.User.find(filter, `email`);
    const existing_email = users.find(
      (item) => item.email.trim().toUpperCase() == email.trim().toUpperCase()
    );
    if (!existing_email) {
      return response.error(400, `Email not found`, res, `Email not found`);
    }

    const user = await models.User.findOne({
      _id: existing_email._id,
      deleted_time: {
        $exists: false,
      },
    });

    if (user.forgot_password_token == null) {
      user.forgot_password_token = generateRandomNumber(4);
      user.forgot_password_expired_time = moment()
        .tz("Asia/Jakarta")
        .add(1, "minutes")
        .toDate();
      await user.save();
    }

    //send email
    const body_user = await content(
      user.email,
      user?.organizations[0]?.organization_id,
      1,
      { name: user.name, token: user.forgot_password_token }
    );
    if (body_user) await models.PendingMail(body_user).save();

    return response.ok(
      true,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  verifyOtpForgotPassword: async function (req, res) {
    const { email, token } = req.body;
    const filter = {
      deleted_time: {
        $exists: false,
      },
    };
    const users = await models.User.find(filter, `email`);
    const existing_email = users.find(
      (item) => item.email.trim().toUpperCase() == email.trim().toUpperCase()
    );
    if (!existing_email) {
      return response.error(400, `Email not found`, res, `Email not found`);
    }

    const user = await models.User.findOne(
      {
        _id: existing_email._id,
        deleted_time: {
          $exists: false,
        },
      },
      `forgot_password_token`
    );

    if (!user) {
      return response.error(400, `User not found`, res, `User not found`);
    }
    if (user.forgot_password_token == null) {
      return response.error(
        400,
        `Invalid OTP code. Please try again`,
        res,
        `Invalid OTP code. Please try again`
      );
    }
    if (user.forgot_password_token != token) {
      return response.error(
        400,
        `Invalid OTP code. Please try again`,
        res,
        `Invalid OTP code. Please try again`
      );
    }

    return response.ok(
      true,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  resetPassword: async function (req, res) {
    const { email, token, password, confirm_password } = req.body;

    if (!password || !confirm_password)
      return response.error(
        400,
        `Please input your new password`,
        res,
        `Please input your new password`
      );

    const filter = {
      deleted_time: {
        $exists: false,
      },
    };
    const users = await models.User.find(filter, `email`);
    const existing_email = users.find(
      (item) => item.email.trim().toUpperCase() == email.trim().toUpperCase()
    );
    if (!existing_email) {
      return response.error(400, `Email not found`, res, `Email not found`);
    }

    const user = await models.User.findOne({
      _id: existing_email._id,
      deleted_time: {
        $exists: false,
      },
    });

    if (!user)
      return response.error(400, `User not found`, res, `User not found`);
    if (user.forgot_password_token == null)
      return response.error(
        400,
        `Invalid OTP code. Please try again`,
        res,
        `Invalid OTP code. Please try again`
      );
    if (user.forgot_password_token != token)
      return response.error(
        400,
        `Invalid OTP code. Please try again`,
        res,
        `Invalid OTP code. Please try again`
      );
    if (password != confirm_password)
      return response.error(
        400,
        `Password not match`,
        res,
        `Password not match`
      );
    if (password.length < 7 || confirm_password.length < 7)
      return response.error(
        400,
        `Password should min. 7 character`,
        res,
        `Password should min. 7 character`
      );

    const hashed_password = await bcrypt.hash(password, 10);

    user.password = hashed_password;
    user.forgot_password_token = null;
    user.forgot_password_expired_time = null;
    await user.save();
    return response.ok(
      true,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  changePassword: async function (req, res) {
    const { user_id, current_password, password, confirm_password } = req.body;

    if (!password || !confirm_password)
      return response.error(
        400,
        `Please input your new password`,
        res,
        `Please input your new password`
      );
    if (password.length < 7 || confirm_password.length < 7)
      return response.error(
        400,
        `Password should min. 7 character`,
        res,
        `Password should min. 7 character`
      );

    const user = await models.User.findOne({
      _id: user_id,
      deleted_time: {
        $exists: false,
      },
    });

    const isValid = await user.validatePassword(current_password);
    if (!isValid) {
      return response.error(400, `Invalid password.`, res, `Invalid password.`);
    }

    if (!user) {
      return response.error(400, `User not found`, res, `User not found`);
    }

    if (password != confirm_password) {
      return response.error(
        400,
        `Password not match`,
        res,
        `Password not match`
      );
    }

    const hashed_password = await bcrypt.hash(password, 10);

    user.password = hashed_password;
    await user.save();
    return response.ok(
      true,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },

  updateProfile: async function (req, res) {
    const { user_id, name, description, gender, phone_number, dob } = req.body;

    const current_date = moment().tz("Asia/Jakarta").format();
    const users = await models.User.find(
      {
        deleted_time: {
          $exists: false,
        },
        _id: {
          $nin: user_id,
        },
      },
      `phone_number`
    );

    const existing_phone_number = users.find(
      (item) =>
        item?.phone_number?.trim().toUpperCase() ==
        phone_number.trim().toUpperCase()
    );
    if (existing_phone_number) {
      return response.error(
        400,
        `Phone number already used by another user`,
        res,
        `Phone number already used by another user`
      );
    }

    const session = await models.User.startSession();
    session.startTransaction();

    try {
      const options = { session };
      const user = await models.User.findOne({
        _id: user_id,
        deleted_time: {
          $exists: false,
        },
      });
      user.name = name;
      user.description = description;
      user.gender = gender;
      if (dob)
        user.dob = moment(dob).tz("Asia/Jakarta").startOf("day").format();
      user.phone_number = phone_number;
      user.updated_at = current_date;
      user.updated_by = req.me._id;
      await user.save(options);

      await session.commitTransaction();
      session.endSession();

      return response.ok(
        user,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
};

module.exports = User;