'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2017.11. 29'});



const postsTable = process.env.POSTS_TABLE

function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Create a post
module.exports.createPost = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  const post = {
    createdAt: new Date().toISOString(),
    AccountNumber: reqBody.AccountNumber,
    TotalBalance: reqBody.TotalBalance,
    FullName: reqBody.FullName
  };

  return db
    .put({
      TableName: postsTable,
      Item: post
    })
    .promise()
    .then(() => {
      callback(null, response(201, post));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};
// Get all posts
module.exports.getAllPosts = (event, context, callback) => {
  return db
    .scan({
      TableName: postsTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of posts
// module.exports.getPosts = (event, context, callback) => {
//   const numberOfPosts = event.pathParameters.number;
//   const params = {
//     TableName: postsTable,
//     Limit: numberOfPosts
//   };
//   return db
//     .scan(params)
//     .promise()
//     .then((res) => {
//       callback(null, response(200, res.Items.sort(sortByDate)));
//     })
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };
// Get a single post
module.exports.getPost = (event, context, callback) => {
  const AccountNumber = event.pathParameters.AccountNumber;

  const params = {
    Key: {
      AccountNumber: AccountNumber
    },
    TableName: postsTable
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Post not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// // Update a post
module.exports.updatePost = (event, context, callback) => {
  const AccountNumber = event.pathParameters.AccountNumber;
  const reqBody = JSON.parse(event.body);
  const { FullName , TotalBalance  } = reqBody;

  const params = {
    Key: {
      AccountNumber: AccountNumber
    },
    TableName: postsTable,
    ConditionExpression: 'attribute_exists(AccountNumber)',
    UpdateExpression: 'SET FullName = :FullName, TotalBalance = :TotalBalance',
    ExpressionAttributeValues: {
      ':FullName': FullName,
      ':TotalBalance': TotalBalance
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a post
module.exports.deletePost = (event, context, callback) => {
  const AccountNumber = event.pathParameters.AccountNumber;
  const params = {
    Key: {
      AccountNumber: AccountNumber
    },
    TableName: postsTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Post deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};
