window.addEventListener("load", Ready); 

function openPage(pageName,elmnt) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }
  document.getElementById(pageName).style.display = "block";
  elmnt.style.backgroundColor = "#4d1170";
}

function Ready () {
  // Get the element with id="defaultOpen" and click on it
  document.getElementById("defaultOpen").click();

  if (window.File && window.FileReader) {
    console.log('ready');
    document.getElementById("UploadButton").addEventListener('click', StartUpload);
    document.getElementById("FileBox").addEventListener('change', FileChosen);
  } else {
    document.getElementById('UploadBox').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
  }
}

var SelectedFile;
var totalFiles;
var Files;
var filesProcessed = 0;
var collectionSize = 0;
var path;
function FileChosen(event) {
  document.getElementById("FileCid").innerHTML = "";
  document.getElementById("FolderCid").innerHTML = "";
  document.getElementById("loader").style.display = "none";
  path = Date.now().toString();
  SelectedFile = event.target.files[0];
  totalFiles = event.target.files.length;
  Files = event.target.files;
  document.getElementById('NameBox').value = SelectedFile.name;
  filesProcessed = 0;
  collectionSize = 0;
}

const socket = new io("http://13.233.207.237:3002"); // hosted
// const socket = new io("http://127.0.0.1:3002"); // local
var FReader;
var Name;
function StartUpload () {
  if (document.getElementById('FileBox').value != "") {
    try {
      FReader = new FileReader();
      SelectedFile = Files[filesProcessed];
      Name = SelectedFile.name;
      var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
      Content += '<div id="ProgreNamessContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
      Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
      document.getElementById('UploadArea').innerHTML = Content;
      FReader.onload = function(event){
          socket.emit('Upload', { 'Name' : Name, Data : event.target.result, 'Path': path });
      }
      socket.emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size, 'Path': path });
    } catch (error) {
      console.log('error:', error);
    }
  } else {
      alert("Please Select A File");
  }
}

socket.on('MoreData', function (data){
  UpdateBar(data['Percent']);
  var Place = data['Place'] * 524288; //The Next Blocks Starting Position
  var NewFile; //The Variable that will hold the new Block of Data
  if(SelectedFile.slice) 
      NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
  else
      NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
  FReader.readAsBinaryString(NewFile);
});

socket.on('FileDownloaded', function (data) {
  if (filesProcessed < totalFiles) {
    SelectedFile = Files[filesProcessed];
    filesProcessed += 1;
    UpdateBar(0);
    StartUpload();
    if (filesProcessed == totalFiles) {
      // emit here for get info
      socket.emit('GetCid', path)
      document.getElementById("UploadArea").innerHTML = '';
	  document.getElementById("loader").style.display = "block";
    }
  }
});

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

socket.on('FileInfo', function (data) {
  collectionSize += data.size;

  document.getElementById("FileCid").innerHTML = "<b>Size:</b> " + bytesToSize(collectionSize) + "<br>"
  if (filesProcessed == totalFiles) {
    document.getElementById("UploadArea").innerHTML = '';
  }
});

socket.on('FolderCid', function (data) {
  document.getElementById("loader").style.display = "none";
  document.getElementById("FolderCid").innerHTML = "<b> Collection CID: " + data.cid + "<br>";
});

function UpdateBar(percent){
  document.getElementById('ProgressBar').style.width = percent + '%';
  document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
  var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
  document.getElementById('MB').innerHTML = MBDone;
}

let contractAbi = ([
{
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "config",
          "type": "string"
        }
      ],
      "name": "StorageRequest",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "config",
          "type": "string"
        }
      ],
      "name": "store",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
]);

let ethaddress;
let web3;

async function connectWallet() {
    if (window.ethereum) {
        web3 = new ethers.providers.Web3Provider(window.ethereum)
    }

    conn = await window.ethereum.enable();

     ethconnected = conn.length > 0
     if (ethconnected) {
         ethaddress = conn[0]    // get wallet address
         console.log('wallet address:', ethaddress);
         document.getElementById("connectButton").style.display = 'none';
         document.getElementById("connectDiv").className = "col-lg-1";
         document.getElementById("walletAddress").style.display = 'block';
         document.getElementById("walletAddress").innerHTML = ethaddress.toString().slice(0, 5) + "..." + ethaddress.toString().slice(-4, );
        }
      return true;
}

async function load() {
    await connectWallet();
}

function callContract() {
    document.getElementById("sentCid").innerHTML = "";
    document.getElementById("tHash").innerHTML = "";
    // window.web3 = new Web3("https://rinkeby.infura.io/v3/3d635004c08743daae3a5cb579559dbd");
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    let cid = document.getElementById("cidInput").value;
    let config = document.getElementById("configInput").value;
    let contract = new ethers.Contract("0xdFEa08D7c2B43498Bfe32778334c9279956057F0", contractAbi, provider);
    let contractWithSigner = contract.connect(signer);
    contractWithSigner.store(cid, config).then(async(res) => {
        document.getElementById("sentCid").innerHTML = '<b>CID:</b> ' + cid;
        document.getElementById("tHash").innerHTML = '<b>Transaction Hash:</b> <a href="https://rinkeby.etherscan.io/tx/' + res.hash + '" target="_blank">' + res.hash + "</a>";
    })
}

function getStorageInfo() {
    document.getElementById("storageInfo").innerHTML = "";
    let cid = document.getElementById("cidInput2").value;
    
    const socket = new io("http://13.233.207.237:3002"); // hosted
    // const socket = new io("http://127.0.0.1:3002"); // local
    // handle the event sent with socket.send()
    socket.on("message", data => {
        console.log(data);
    });
  
    socket.on("connect", () => {
        socket.emit("cid", cid);
    });

    socket.on("storageInfo", (storageInfo) => {
        document.getElementById("storageBrief").style.display = 'none';
        if (!storageInfo.storageInfo) {
            storageInfo = jQuery.parseJSON(storageInfo)
            var textedJson = JSON.stringify(storageInfo, undefined, 4);
            document.getElementById("storageInfo").innerHTML = textedJson;
            if (storageInfo.cidInfo.currentStorageInfo.cold.filecoin.proposalsList[0].dealId) {
              document.getElementById("storageBrief").style.display = 'block';
              let dealId = storageInfo.cidInfo.currentStorageInfo.cold.filecoin.proposalsList[0].dealId;
              document.getElementById("storageBrief").innerHTML = '<b>Deal ID: </b><a href="https://filfox.info/en/deal/' + dealId + '" target="_blank">' + dealId + '</a>';
            }
        } else {
            document.getElementById("storageInfo").innerHTML = storageInfo.storageInfo.toString();
        }
        socket.disconnect() 
    });
}

function useDefaultConfig() {
  document.getElementById("configInput").value = "";
  document.getElementById("configInput").value = "{hot:{enabled:true,allowUnfreeze:true,ipfs:{addTimeout:900},unfreezeMaxPrice:0},cold:{enabled:true,filecoin:{replicationFactor:1,dealMinDuration:518400,excludedMiners:[],trustedMiners:[],countryCodes:[],renew:{enabled:false,threshold:1},address:f3rpbm3bt4muydk3iq5ainss6phht4bjbe5dq6egrx4rwzqjgwc5eruyloozvf6qjunubo467neaqsvbzyxnna,maxPrice:100000000000,fastRetrieval:true,dealStartOffset:8640,verifiedDeal:true}},repairable:false}";
}
