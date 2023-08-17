import { Component, AfterViewInit, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { LookUpService } from "app/core/services/LookUp.service";
import { AlertifyService } from "app/core/services/alertify.service";

import { environment } from "environments/environment";
import { AuthService } from "../login/services/auth.service";
import { WashingControll_FloorControll } from "./models/washingcontroll_floorcontroll";
import { WashingControll_FloorControllService } from "./services/washingcontroll_floorcontroll.service";
import { FloorService } from "../floor/services/wscFloor.service";
import { WashingControll_Floor } from "../floor/models/wscFloor";
import { Error } from "../error/models/error";
import { ErrorService } from "../error/services/error.service";
import { error } from "console";

declare var jQuery: any;

@Component({
  selector: "app-washingControll_FloorControll",
  templateUrl: "./washingControll_FloorControll.component.html",
  styleUrls: ["./washingControll_FloorControll.component.scss"],
})
export class WashingControll_FloorControllComponent
  implements AfterViewInit, OnInit
{
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns: string[] = ["errorName", "amount", "percent", "delete"];

  washingControll_FloorControllList: WashingControll_FloorControll[];
  washingControll_FloorControll: WashingControll_FloorControll =
    new WashingControll_FloorControll();

  floorListLenght: number = 0;
  floorList: WashingControll_Floor[];
  errorList: Error[];
  errorList0:Error;
  errorListColor0:string
  errorListisError0:Boolean;
  errorListName0:string

  selectedError: Error;
  selectedErrors: WashingControll_FloorControll[] = [];

  faultyProduct: number = 0;
  totalPercent: number = 0;
  washingControll_FloorControllAddForm: FormGroup;

  washingControll_FloorControllId: number;

  constructor(
    private errorService: ErrorService,
    private floorService: FloorService,
    private washingControll_FloorControllService: WashingControll_FloorControllService,
    private lookupService: LookUpService,
    private alertifyService: AlertifyService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.faultyProduct = 0; // İlk başta hatalı ürün sayısını sıfırlayın
  }

  ngAfterViewInit(): void {}

  ngOnInit() {
    this.getWashingControll_FloorControllList();
    this.getErrorList();
    this.createWashingControll_FloorControllAddForm();
    this.getFloorList();
	this.getTotalCount();
	this.calculateTotal();
  }

  getWashingControll_FloorControllList() {
    this.washingControll_FloorControllService
      .getWashingControll_FloorControllList()
      .subscribe((data) => {
        this.washingControll_FloorControllList = data;
        this.dataSource = new MatTableDataSource(data);
        this.configDataTable();
      });
  }

  save() {
	console.log("tıklandı");
	
    this.washingControll_FloorControll = Object.assign({},this.washingControll_FloorControllAddForm.value);
	this.washingControll_FloorControll.amount=this.getTotalCount();
	this.washingControll_FloorControll.percent=this.calculateTotal();
	this.washingControll_FloorControll.faultyProduct=this.faultyProduct;
    if (this.washingControll_FloorControll.id == 0)
      this.addWashingControll_FloorControll();
    else this.updateWashingControll_FloorControll();
  }

  getTotalCount(): number {
    return this.selectedErrors.reduce(
      (total, error) => total + error.amount,
      0
    );
  }

  calculateTotal(): number {
    let total = 0;
    this.dataSource.data.forEach((item: any) => {
      total += this.calculatePercent(item);
    });
    return total;
  }

  calculatePercent(element: any): number {
    if (element.isError) {
      const totalAmount = this.getTotalCount();
      const percent = Math.round((element.amount / totalAmount) * 100);
      this.totalPercent += percent;
      return percent;
    } else {
      return 0;
    }
  }

  addErrorToTable(error: Error) {
    const existingErrorIndex = this.selectedErrors.findIndex(
      (e) => e.errorName === error.errorName
    );

    if (existingErrorIndex === -1) {
      this.selectedErrors.push({ ...error, amount: 1 });
    } else {
      this.selectedErrors[existingErrorIndex].amount++;
    }

    this.dataSource = new MatTableDataSource(this.selectedErrors);
  }

  addFaulty(error: Error) {
    if (error.isError == true) {
      this.faultyProduct += 1;
    }
    this.addErrorToTable(error);
  }

  getErrorList() {
    this.errorService.getErrorList().subscribe((data) => {
      this.errorList = data;
	  this.errorListColor0=this.errorList[0].colorCode
	  this.errorListisError0=this.errorList[0].isError
	  this.errorListName0=this.errorList[0].errorName
    });
  }

  getFloorList() {
    this.floorService.getWashingControll_FloorList().subscribe((data) => {
      this.floorList = data;

      this.floorListLenght = this.floorList.length - 1;
    });
  }

  addWashingControll_FloorControll() {
    this.washingControll_FloorControllService
      .addWashingControll_FloorControll(this.washingControll_FloorControll)
      .subscribe((data) => {
        this.getWashingControll_FloorControllList();
        this.washingControll_FloorControll =
          new WashingControll_FloorControll();
        jQuery("#washingcontroll_floorcontroll").modal("hide");
        this.alertifyService.success(data);
        this.clearFormGroup(this.washingControll_FloorControllAddForm);
      },(error)=>{
		this.alertifyService.error(error.error)
	  });
  }

  updateWashingControll_FloorControll() {
    this.washingControll_FloorControllService
      .updateWashingControll_FloorControll(this.washingControll_FloorControll)
      .subscribe((data) => {
        var index = this.washingControll_FloorControllList.findIndex(
          (x) => x.id == this.washingControll_FloorControll.id
        );
        this.washingControll_FloorControllList[index] =
          this.washingControll_FloorControll;
        this.dataSource = new MatTableDataSource(
          this.washingControll_FloorControllList
        );
        this.configDataTable();
        this.washingControll_FloorControll =
          new WashingControll_FloorControll();
        jQuery("#washingcontroll_floorcontroll").modal("hide");
        this.alertifyService.success(data);
        this.clearFormGroup(this.washingControll_FloorControllAddForm);
      });
  }
  setControllResultToTamir() {
    this.washingControll_FloorControllAddForm.get('controllResult')?.setValue('Tamir');
	this.save();
  }
  createWashingControll_FloorControllAddForm() {
    this.washingControll_FloorControllAddForm = this.formBuilder.group({
      id: [0],
      errorName: ["", Validators.required],
      amount: [0, Validators.required],
      faultyProduct: ["", Validators.required],
      controllTime: ["", Validators.required],
      controllResult: ["", Validators.required],
      managerReview: ["", Validators.required],
    });
  }

  deleteWashingControll_FloorControll(washingControll_FloorControllId: number) {
    this.washingControll_FloorControllService
      .deleteWashingControll_FloorControll(washingControll_FloorControllId)
      .subscribe((data) => {
        this.alertifyService.success(data.toString());
        this.washingControll_FloorControllList =
          this.washingControll_FloorControllList.filter(
            (x) => x.id != washingControll_FloorControllId
          );
        this.dataSource = new MatTableDataSource(
          this.washingControll_FloorControllList
        );
        this.configDataTable();
      });
  }

  getWashingControll_FloorControllById(
    washingControll_FloorControllId: number
  ) {
    this.clearFormGroup(this.washingControll_FloorControllAddForm);
    this.washingControll_FloorControllService
      .getWashingControll_FloorControllById(washingControll_FloorControllId)
      .subscribe((data) => {
        this.washingControll_FloorControll = data;
        this.washingControll_FloorControllAddForm.patchValue(data);
      });
  }

  clearFormGroup(group: FormGroup) {
    group.markAsUntouched();
    group.reset();

    Object.keys(group.controls).forEach((key) => {
      group.get(key).setErrors(null);
      if (key == "id") group.get(key).setValue(0);
    });
  }

  checkClaim(claim: string): boolean {
    return this.authService.claimGuard(claim);
  }

  configDataTable(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}