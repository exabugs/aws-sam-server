import _ from 'lodash';
import yaml from '../src/index';

test('Ref', () => {
  const buff = [
    'URL0:', //
    '  Ref: "URL"',
    'URL1:',
    '  !Ref URL',
  ].join('\n');
  const result = yaml.load(buff, { URL: 'www.google.com' });
  const ans = {
    URL0: 'www.google.com',
    URL1: 'www.google.com',
  };
  expect(result).toEqual(ans);
});

test('Join', () => {
  const buff = [
    'URL0:',
    '  Fn::Join: ["/", ["111", "222"]]',
    'URL1:',
    '  !Join',
    '    - /',
    '    -  - "111"',
    '       - "222"',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: '111/222',
    URL1: '111/222',
  };
  expect(result).toEqual(ans);
});

test('Select', () => {
  const buff = [
    'URL0:',
    '  Fn::Select: [0, ["111", "222"]]',
    'URL1:',
    '  !Select',
    '    - 0',
    '    -  - "111"',
    '       - "222"',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: '111',
    URL1: '111',
  };
  expect(result).toEqual(ans);
});

test('Split', () => {
  const buff = [
    'URL0:',
    '  Fn::Split: ["/", "111/222"]',
    'URL1:',
    '  !Split',
    '    - "/"',
    '    - "111/222"',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: ['111', '222'],
    URL1: ['111', '222'],
  };
  expect(result).toEqual(ans);
});

test('GetAtt sequence', () => {
  const buff = [
    'URL0:',
    '  Fn::GetAtt: ["user", "name"]',
    'URL1:',
    '  !GetAtt',
    '    - user',
    '    - name',
  ].join('\n');
  const result = yaml.load(buff, { user: { name: 'hello' } });
  const ans = {
    URL0: 'hello',
    URL1: 'hello',
  };
  expect(result).toEqual(ans);
});

test('GetAtt scalar', () => {
  const buff = [
    'URL0:',
    '  Fn::GetAtt: "user.name"',
    'URL1:',
    '  !GetAtt user.name',
  ].join('\n');
  const result = yaml.load(buff, { user: { name: 'hello' } });
  const ans = {
    URL0: 'hello',
    URL1: 'hello',
  };
  expect(result).toEqual(ans);
});

test('Sub sequence', () => {
  const buff = [
    'URL0:',
    '  Fn::Sub: ["www.${Domain}", { "Domain": "RootDomainName" }]',
    'URL1:',
    '  !Sub',
    '    - "www.${Domain}"',
    '    - { "Domain": "RootDomainName" }',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: 'www.RootDomainName',
    URL1: 'www.RootDomainName',
  };
  expect(result).toEqual(ans);
});

test('Sub scalar', () => {
  const buff = [
    'URL0:',
    '  Fn::Sub: "www.${Domain}"',
    'URL1:',
    '  !Sub www.${Domain}',
  ].join('\n');
  const result = yaml.load(buff, { Domain: 'RootDomainName' });
  const ans = {
    URL0: 'www.RootDomainName',
    URL1: 'www.RootDomainName',
  };
  expect(result).toEqual(ans);
});

test('FindInMap', () => {
  const buff = [
    'Mappings:',
    '  RegionMap:',
    '    us-east-1:',
    '      HVM64: "ami-0ff8a91507f77f867"',
    '      HVMG2: "ami-0a584ac55a7631c0c"',
    'URL0:',
    '  Fn::FindInMap: ["RegionMap", "us-east-1", "HVMG2"]',
    'URL1:',
    '  !FindInMap',
    '    - RegionMap',
    '    - us-east-1',
    '    - HVMG2',
  ].join('\n');
  const result = _.pick(yaml.load(buff), ['URL0', 'URL1']);
  const ans = {
    URL0: 'ami-0a584ac55a7631c0c',
    URL1: 'ami-0a584ac55a7631c0c',
  };
  expect(result).toEqual(ans);
});

test('GetAZs', () => {
  const buff = [
    'URL0:',
    '  Fn::GetAZs: "ap-northeast-1"',
    'URL1:',
    '  !GetAZs ap-northeast-1',
    'URL2:',
    '  Fn::GetAZs: ""',
    'URL3:',
    '  !GetAZs',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
    URL1: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
    URL2: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
    URL3: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
  };
  expect(result).toEqual(ans);
});

test('AWS parameters', () => {
  const buff = [
    'AccountId: !Ref AWS::AccountId',
    'NotificationARNs: !Ref AWS::NotificationARNs',
    'Partition: !Ref AWS::Partition',
    'Region: !Ref AWS::Region',
    'StackId: !Ref AWS::StackId',
    'StackName: !Ref AWS::StackName',
    'URLSuffix: !Ref AWS::URLSuffix',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    AccountId: '',
    NotificationARNs: [],
    Partition: 'aws',
    Region: 'us-east-1',
    StackId: '',
    StackName: '',
    URLSuffix: 'amazonaws.com',
  };
  expect(result).toEqual(ans);
});

test('Equals', () => {
  const buff = [
    'URL0:',
    '  Fn::Equals: ["111", "111"]',
    'URL1:',
    '  !Equals',
    '    - "111"',
    '    - "111"',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: true,
    URL1: true,
  };
  expect(result).toEqual(ans);
});

test('And', () => {
  const buff = [
    'URL0:',
    '  Fn::And: [true, true, false]',
    'URL1:',
    '  Fn::And: [true, true, true]',
    'URL2:',
    '  !And',
    '    - true',
    '    - true',
    '    - false',
    'URL3:',
    '  !And',
    '    - true',
    '    - true',
    '    - true',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: false,
    URL1: true,
    URL2: false,
    URL3: true,
  };
  expect(result).toEqual(ans);
});

test('Or', () => {
  const buff = [
    'URL0:',
    '  Fn::Or: [true, true, false]',
    'URL1:',
    '  Fn::Or: [true, true, true]',
    'URL2:',
    '  !Or',
    '    - true',
    '    - true',
    '    - false',
    'URL3:',
    '  !Or',
    '    - false',
    '    - false',
    '    - false',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: true,
    URL1: true,
    URL2: true,
    URL3: false,
  };
  expect(result).toEqual(ans);
});

test('Not', () => {
  const buff = [
    'URL0:',
    '  Fn::Not: [true]',
    'URL1:',
    '  !Equals',
    '    - true',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: false,
    URL1: false,
  };
  expect(result).toEqual(ans);
});

test('If', () => {
  const buff = [
    'Conditions:',
    '  CreateProdResources: !Equals [!Ref EnvType, "prod"]',
    '  CreateDevResources: !Equals [!Ref EnvType, "dev"]',
    'URL0:',
    '  Fn::If: ["CreateProdResources", "create_prod", "create_dev"]',
    'URL1:',
    '  !If',
    '    - CreateDevResources',
    '    - create_dev',
    '    - create_prod',
  ].join('\n');
  const result = _.pick(yaml.load(buff, { EnvType: 'prod' }), ['URL0', 'URL1']);
  const ans = {
    URL0: 'create_prod',
    URL1: 'create_prod',
  };
  expect(result).toEqual(ans);
});

test('Base64', () => {
  const buff = [
    'URL0:',
    '  Fn::Base64: "HelloWorld1"',
    'URL1:',
    '  !Base64 HelloWorld2',
  ].join('\n');
  const result = yaml.load(buff);
  const base64 = (str: string) => Buffer.from(str).toString('base64');
  const ans = {
    URL0: base64('HelloWorld1'),
    URL1: base64('HelloWorld2'),
  };
  expect(result).toEqual(ans);
});

test('Cidr', () => {
  // この例では、「/24」のマスクを持つ CIDR から、内部にサブネットマスク「/27」を持つ 6 つの CIDR を作成します。
  const buff = [
    'URL0:',
    '  Fn::Cidr: [ "192.168.0.0/24", 6, 5 ]',
    'URL1:',
    '  !Cidr [ "192.168.0.0/24", 6, 5 ]',
  ].join('\n');
  const result = yaml.load(buff);
  const cidr = [
    '192.168.0.0/27',
    '192.168.0.32/27',
    '192.168.0.64/27',
    '192.168.0.96/27',
    '192.168.0.128/27',
    '192.168.0.160/27',
  ];
  const ans = {
    URL0: cidr,
    URL1: cidr,
  };
  expect(result).toEqual(ans);
});

test('ImportValue', () => {
  const buff = [
    'URL0:',
    '  Fn::ImportValue: "hogehoge"',
    'URL1:',
    '  !ImportValue hogehoge',
  ].join('\n');
  const result = yaml.load(buff);
  const ans = {
    URL0: 'hogehoge',
    URL1: 'hogehoge',
  };
  expect(result).toEqual(ans);
});
