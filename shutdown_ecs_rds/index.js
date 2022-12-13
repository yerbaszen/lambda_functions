const AWS = require('aws-sdk');
var ecs = new AWS.ECS();
var rds = new AWS.RDS();
​
exports.handler = (event) => {
  console.log('Turn off PERFORMANCE environment')
  // Deactivate ECS
  var paramsTranscript = {
    desiredCount: 0,
    cluster: 'prp-cluster-performance',
    service: 'prp-transcript-srv-performance'
  };
  ecs.updateService(paramsTranscript, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      console.log('Turn off transcript service: ', data);
    }
  });
  var paramsBe = {
    desiredCount: 0,
    cluster: 'prp-cluster-performance',
    service: 'prp-be-srv-performance'
  };
  ecs.updateService(paramsBe, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      console.log('Turn off backend service: ', data);
    }
  });
​
  // Stop RDS Cluster
  var paramsRDS = {
    DBClusterIdentifier: 'db-prp-performance'
  };
  rds.stopDBCluster(paramsRDS, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log('Turned off performance DB Cluster: ', data);
    }
  });
};
