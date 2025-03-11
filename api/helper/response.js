const response_data = {
  send: (values, res) => {
    res.json(values);
    res.end();
  },
  ok: (values, res, message, pages) => {
    let data = {
      success: true,
      status: 200,
      data: values,
      message,
      pages,
    };
    res.json(data);
    res.end();
  },
  badRequest: function (res, message) {
    return res.status(400).json({
      success: false,
      message: message || "Bad Request",
    });
  },
  notFound: function (res, message) {
    return res.status(404).json({
      success: false,
      message: message || "Not Found",
    });
  },
  serverError: function (res, message) {
    return res.status(500).json({
      success: false,
      message: message || "Server Error",
    });
  },
  back: (code, values, message, fields) => {
    let data = {
      status: code,
      data: values,
      message,
      fields,
    };
    return data;
  },
  success: (res, fields) => {
    let data = {
      success: true,
      status: 201,
      data: null,
      message: `Success with empty data`,
      fields,
    };
    res.json(data);
    res.end();
  },
  error: (status, message, res, err, fields) => {
    let data = {
      success: false,
      status,
      message,
      err,
      fields,
    };
    res.json(data);
    res.end();
  },
  done: (message, res, token) => {
    let data = {
      success: true,
      status: 200,
      message: message,
      token: token,
    };
    res.json(data);
    res.end();
  },
  redirect: (url, res) => {
    res.redirect(url);
  },
};

module.exports = response_data;
