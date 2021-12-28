// Copyright 2022 by Croquet Corporation. All Rights Reserved.
// Collaboratve Card

import { AM_Events, PM_Events } from './DEvents.js';
import { THREE, Actor, Pawn, mix, AM_Spatial, PM_Spatial, viewRoot} from "@croquet/worldcore";
import { PM_ThreeVisibleLayer } from './DLayerManager.js';
import { D_CONSTANTS } from './DConstants.js';

const CardColor = 0x9999cc;  // light blue
const OverColor = 0xffff77;   // yellow
const DownColor = 0x88ff88; // green
const NoColor =0x000000; // black
const timeOutDown = 5000; // if no user action after down event, then cancel
const timeOutOver = 10000; // if no user action after enter event, then cancel
export class Actor_Card extends mix(Actor).with(AM_Spatial, AM_Events){
    get pawn() {return Pawn_Card}
    init(...args) {
        this.visible = true;
        super.init(...args);
        this._translation = [0, 2, -10];
        // managing multiple users
        this._downUsers = new Map(); 
        this._overUsers = new Map();
        this.future(1000).timeOutEvent();
    }

    // check if user hasn't moved if pointer is down or over
    // cancel event if no action ins some period of time
    timeOutEvent(){
        let n = this.now();
        let userId;
        if(this._downUsers.size>0){
            userId = this._downUsers.keys().next().value;
            if(n-this._downUsers.get(userId)>5000){
                this._downUsers.delete(userId);
                this.onPointerDownCancel()
            }
        }
        if(this._overUsers.size>0){
            userId = this._overUsers.keys().next().value;
            if(n-this._overUsers.get(userId)>10000){
                this._overUsers.delete(userId);
                this.onPointerOverCancel()
            }   
        }     
        this.future(1000).timeOutEvent();
    }

    multiUser(){ return true; }

    onPointerDown(p3d){
        if(this.multiUser() || this._downUsers.size === 0 ){
            this._downUsers.set(p3d.playerId, this.now());
            this.say("doPointerDown", p3d);
        }
    }
    onPointerUp(p3d){
        if(this._downUsers.has(p3d.playerId)){
            this._downUsers.delete(p3d.playerId);
            this.say("doPointerUp", p3d);
        }
    }
    onPointerMove(p3d){
        if(this._downUsers.has(p3d.playerId)){
            this._downUsers.set(p3d.playerId, this.now())// update the _downUser
            this.say("doPointerMove", p3d);
        }
    }
    onPointerDownCancel(pId){
        this.say("doPointerDownCancel", pId);
    }    
    onPointerEnter(p3d){
        if(this.multiUser() || this._overUsers.size === 0 ){
            this._overUsers.set(p3d.playerId, this.now());
            this.say("doPointerEnter", p3d);
        }
    }
    onPointerOver(p3d){
        if(this._overUsers.has(p3d.playerId)){
            this._overUsers.set(p3d.playerId, this.now())// update the _overUser
            this.say("doPointerOver", p3d);
        }
    }
    onPointerLeave(p3d){
        if(this._overUsers.has(p3d.playerId)){
            this._overUsers.delete(p3d.playerId);
            this.say("doPointerLeave", p3d);
        }
    }    
    onPointerOverCancel(pId){
        this.say("doPointerLeave", pId);
    }   

    onPointerWheel(p3d){
        let s = this.scale;
        let w = p3d.wheel < 0?-0.1:0.1;
        if(s[0]+w >0.3){
            this._scale = [s[0]+w, s[1]+w, s[2]+w];
            this.scaleChanged();
        }
        //this.say("doPointerWheel", p3d);
    }
    onKeyDown(e){
        console.log(e)
    }
    onKeyUp(e){
        console.log(e)
    }
    showHide(){}
}

Actor_Card.register('Actor_Card');

class Pawn_Card extends mix(Pawn).with(PM_Spatial, PM_Events, PM_ThreeVisibleLayer, ){
    constructor(...args) {
        super(...args);
        this.constructCardBase();
    //    this.constructOutline();
        this.listen("doPointerDown", this.doPointerDown);
        this.listen("doPointerMove", this.doPointerMove)
        this.listen("doPointerUp", this.doPointerUp);
        this.listen("doPointerDownCancel", this.doPointerUp);
        this.listen("doPointerEnter", this.doPointerEnter);
        this.listen("doPointerOver", this.doPointerOver);
        this.listen("doPointerLeave", this.doPointerLeave);
        this.listen("doPointerOverCancel", this.doPointerLeave);
        this.listen("doPointerWheel", this.doPointerWheel);
    }

    constructCardBase()
    {
       // this.color = new THREE.Color();
        this.cardGroup = new THREE.Group();
        this.cardBase = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.1, 2, 2, 1),
            new THREE.MeshStandardMaterial({color: CardColor}));
        this.cardBase.castShadow = true;
        this.cardBase.recieveShadow = true;
        this.cardGroup.add(this.cardBase);
        this.setRenderObject( this.cardGroup, D_CONSTANTS.EVENT_LAYER );
    }

    doPointerDown(p3d){ this.hilite(DownColor)}
    doPointerMove(p3d){}
    doPointerUp(p3d){
        if(p3d && p3d.sameTarget)console.log("Do something");
        else console.log("Don't do anything");
        this.hilite(NoColor);
    }
    doPointerCancel(p3d){}
    doPointerEnter(p3d){

        this.hilite(OverColor);
    }
    doPointerOver(p3d){}
    doPointerLeave(p3d){this.hilite(NoColor)}
    doPointerWheel(p3d){

    }
    hilite(color) { 
        this.cardBase.material.emissive = new THREE.Color(color);
    }

    
    makePlane(pEvt, useNorm) {
        // worldDirection is an optional direction vector if you don't want to
        // use the objects world direction
        let pos = new THREE.Vector3(), norm = new THREE.Vector3();
        pos.copy(pEvt.point);
        //this.object3D.worldToLocal(vec0);
        //let offset = vec0.z;
        if (useNorm && pEvt.face && pEvt.face.normal) {
          norm.copy(pEvt.face.normal);
          let normalMatrix = new THREE.Matrix3().getNormalMatrix( this.object3D.matrixWorld );
          norm.applyMatrix3( normalMatrix ).normalize();
        }
        else this.object3D.getWorldDirection(norm);
        let offset = norm.dot(pos); // direction dotted with position in world coords
        this.plane = new THREE.Plane(norm, -offset);
    }

    trackPlane(pEvt, vec) {
        if (this.plane) {
            let vec0 = vec || new THREE.Vector3();
            pEvt.ray3D.ray.intersectPlane(this.plane, vec0);
            return vec0;
        }
        return null;
    }
}

